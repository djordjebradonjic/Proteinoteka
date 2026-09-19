package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.util.PriceParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
@RequiredArgsConstructor
public class SupplementStoreScraper implements StoreScraper {

    private static final String STORE_NAME  = "SupplementStore";
    private static final String BASE_URL    = "https://supplementstore.rs";
    private static final String LISTING_URL = BASE_URL + "/kategorije/proteini?limit=100";

    private final BaseScraperEnricher    baseEnricher;
    private final ProductRepository      productRepository;
    private final PriceParser            priceParser;

    private volatile int productLimit = Integer.MAX_VALUE;

    public void setProductLimit(int limit)  { this.productLimit = limit; }
    public void resetProductLimit()         { this.productLimit = Integer.MAX_VALUE; }

    @Override public String  getStoreName()            { return STORE_NAME; }
    @Override public String  getBaseUrl()              { return LISTING_URL; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public boolean hasNextPage(Document doc) {
        // ?limit=100 caps a page at 100 products and the category has more (114 at the time of
        // writing); the theme renders a "next" link in ul.pagination only while pages remain.
        return doc.selectFirst("ul.pagination a.next") != null;
    }

    @Override
    public String buildPageUrl(int page) {
        // ScraperService pages are 0-indexed, the site's ?page= is 1-indexed
        return page == 0 ? LISTING_URL : LISTING_URL + "&page=" + (page + 1);
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> products = parseListingPage(doc);
        log.info("[{}] Parsed {} products from listing page", STORE_NAME, products.size());

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products, skipUrls, productLimit);
        }

        return products;
    }

    // ── Listing parsing ──────────────────────────────────────────────────────────

    private List<Product> parseListingPage(Document doc) {
        List<Product> products = new ArrayList<>();
        Elements cards = doc.select(".product-layout");
        Set<String> seenUrls = new HashSet<>();

        for (Element card : cards) {
            Element linkEl = card.selectFirst("div.name a");
            if (linkEl == null) continue;

            String href = linkEl.attr("href").trim();
            // Strip ?limit=100 from listing URLs to get canonical product URL
            int q = href.indexOf('?');
            String url = q >= 0 ? href.substring(0, q) : href;
            if (url.isBlank()) continue;
            if (!url.startsWith("http")) url = BASE_URL + url;
            // Sale items are rendered twice on this page (main grid + specials module) — skip repeats
            if (!seenUrls.add(url)) continue;

            Product p = new Product();
            p.setUrl(url);
            p.setName(linkEl.text().trim());
            if (p.getName().isBlank()) continue;

            // Parse weight from name (e.g. "100% Whey Prostar, 2,39kg")
            Double weightGrams = parseWeightFromName(p.getName());
            if (weightGrams != null) {
                p.setPrimaryWeightGrams(weightGrams);
                p.getPackage_weight().add(formatWeight(weightGrams));
            }

            // Regular: <div class="price"><span class="price-normal">X RSD</span></div>;
            // Sale: <span class="price-new">X</span> + <span class="price-old">Y</span>
            Element priceEl = card.selectFirst("div.price .price-new");
            if (priceEl == null) priceEl = card.selectFirst("div.price .price-normal");
            if (priceEl != null) p.setPrice(parsePriceString(priceEl.text()));

            // Listing image — upgrade to 600x600 by replacing thumbnail suffix
            Element img = card.selectFirst("img.img-first");
            if (img == null) img = card.selectFirst("img.img-responsive");
            if (img != null) {
                String src = img.attr("src").trim();
                if (!src.isBlank()) {
                    src = src.replace("-350x350.", "-600x600.").replace("-228x228.", "-600x600.");
                    if (!src.startsWith("http")) src = BASE_URL + src;
                    p.setImageUrl(src);
                }
            }

            products.add(p);
            log.debug("[{}] Listed: '{}' {}g → {}", STORE_NAME, p.getName(),
                    p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) : "?",
                    p.getPrice());
        }

        return products;
    }

    // ── Detail page enrichment ───────────────────────────────────────────────────

    private void enrichWithDetails(Page page, List<Product> products, Set<String> skipUrls) {
        enrichWithDetails(page, products, skipUrls, Integer.MAX_VALUE);
    }

    private void enrichWithDetails(Page page, List<Product> products, Set<String> skipUrls, int productLimit) {
        int count = 0;

        for (Product p : products) {
            if (count >= productLimit) {
                log.info("[{}] Reached product limit ({}) — stopping detail enrichment", STORE_NAME, productLimit);
                break;
            }
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, p.getName());
                continue;
            }

            // Price already known from listing; check if we can skip the detail page entirely
            if (skipUrls.contains(p.getUrl()) && p.getPrice() != null) {
                restoreFromDb(p);
                log.info("[{}] Skipping detail page for '{}' — nutrition complete in DB", STORE_NAME, p.getName());
                continue;
            }

            try {
                long sleep = 2000 + ThreadLocalRandom.current().nextLong(2000);
                log.info("[{}] Sleeping {}ms before '{}'...", STORE_NAME, sleep, p.getName());
                Thread.sleep(sleep);

                if (!navigateWithRetry(page, p.getUrl(), 3)) {
                    log.error("[{}] Failed to load {} — skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                if (isBlockedByFirewall(page)) {
                    log.error("[{}] FIREWALL DETECTED — stopping", STORE_NAME);
                    return;
                }

                page.waitForTimeout(500 + ThreadLocalRandom.current().nextInt(800));

                // Parse price/brand/image BEFORE clicking any tab — tab click can navigate away
                Document docMain = Jsoup.parse(page.content());
                enrichBrand(docMain, p);
                enrichPriceFromDetail(docMain, p);
                enrichImageFromDetail(docMain, p);
                enrichDescription(docMain, p);

                if (!skipUrls.contains(p.getUrl())) {
                    // Journal3 theme renders all tab panes in the initial HTML — no tab click needed
                    Document docNutrition = docMain;

                    extractNutritionFromBrText(docNutrition, p);

                    // No protein guess from the marketing description: it mixes per-serving grams
                    // ("24 g proteina" → 24, "30 g proteina" → 30) and ad copy ("90% proteina") with
                    // per-100g values. A wrong value is worse than none — a "too low" one makes
                    // saveOrUpdateProduct drop the whole product, and the DB/AI fallbacks below only
                    // run for a null protein.

                    baseEnricher.enrichWithAiIfNeeded(docNutrition, p, STORE_NAME);
                } else {
                    restoreNutritionFromDb(p);
                }

                log.info("[{}] Enriched '{}' {}g → price={}, brand={}, protein={}g/100g",
                        STORE_NAME, p.getName(),
                        p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) : "?",
                        p.getPrice(), p.getBrand(), p.getProteinPer100g());

                count++;
                if (count % 15 == 0) {
                    long batchSleep = 12000 + ThreadLocalRandom.current().nextLong(8000);
                    log.info("[{}] Batch pause {}ms after {} products", STORE_NAME, batchSleep, count);
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich '{}': {}", STORE_NAME, p.getName(), e.getMessage());
                safeSleep(5000);
            }
        }
    }

    // ── Field enrichment ─────────────────────────────────────────────────────────

    private void enrichBrand(Document doc, Product p) {
        // Journal3 theme: <div class="product-manufacturer"><a href=".../brend/x"><span>Brand</span></a></div>
        Element manufacturer = doc.selectFirst(".product-manufacturer a");
        if (manufacturer != null) {
            String brand = manufacturer.text().trim();
            if (!brand.isBlank()) { p.setBrand(brand); return; }
        }
        // Legacy OpenCart theme: manufacturer in a <ul> list with "Proizvođač:" label
        for (Element li : doc.select("ul li")) {
            String text = li.text();
            if (text.contains("Proizvođač:") || text.contains("Manufacturer:")) {
                Element a = li.selectFirst("a");
                if (a != null) {
                    String brand = a.text().trim();
                    if (!brand.isBlank()) { p.setBrand(brand); return; }
                }
                // Fallback: text after the label
                String raw = text.replaceAll("(?i)proizvođač:|manufacturer:", "").trim();
                if (!raw.isBlank()) p.setBrand(raw);
                return;
            }
        }
    }

    private void enrichPriceFromDetail(Document doc, Product p) {
        // supplementstore.rs (Journal3): main product price is in .product-price-group > .price-group.
        // Do NOT use .price-normal — those elements appear in related-product cards and return the
        // wrong (related) product's price, causing swapped prices between variants.
        // Regular: <div class="product-price">; sale: <div class="product-price-new"> + <div class="product-price-old">
        Element priceEl = doc.selectFirst(".product-price-group .product-price-new");
        if (priceEl == null) priceEl = doc.selectFirst(".product-price-group .product-price");
        if (priceEl != null) {
            String price = parsePriceString(priceEl.text());
            if (price != null && !price.isBlank()) p.setPrice(price);
        }
    }

    private void enrichImageFromDetail(Document doc, Product p) {
        // og:image gives the best-quality product image
        Element meta = doc.selectFirst("meta[property=og:image]");
        if (meta != null) {
            String content = meta.attr("content").trim();
            if (!content.isBlank()) { p.setImageUrl(content); return; }
        }
        // Fallback: first catalog image (prefer 600x600)
        Element img = doc.selectFirst("img[src*=/image/cache/catalog]");
        if (img != null) {
            String src = img.attr("src").trim();
            if (!src.isBlank()) {
                src = src.replace("-228x228.", "-600x600.")
                         .replace("-150x150.", "-600x600.");
                if (!src.startsWith("http")) src = BASE_URL + src;
                p.setImageUrl(src);
            }
        }
    }

    private void enrichDescription(Document doc, Product p) {
        // First tab pane of the product info tabs ("Opis"); the others are "Sastav" and reviews
        Element el = doc.selectFirst(".product-info .tab-content > .tab-pane");
        if (el == null) el = doc.selectFirst("#tab-description");
        if (el != null) {
            String text = el.text().trim();
            if (!text.isBlank()) p.setDescription(text);
        }
    }

    // ── Nutrition extraction ─────────────────────────────────────────────────────

    /**
     * supplementstore.rs embeds nutrition data as <br>-separated text inside #tab-description,
     * not in an HTML table. Format per line:
     *   "Proteini    25g    83,3"
     *   "Masti       1g     3,3g"
     *   "Energija    545kJ/129kcal    1664kJ/398kcal"
     * The LAST numeric value on each line is always the per-100g value.
     */
    private void extractNutritionFromBrText(Document doc, Product p) {
        // "Sastav" tab (custom product tab module); older theme used #tabcustom0
        Element tabEl = doc.selectFirst(".product-info .tab-pane[id^=product_extra_]");
        if (tabEl == null) tabEl = doc.selectFirst("#tabcustom0");
        if (tabEl == null) tabEl = doc.selectFirst("#tab-description");
        if (tabEl == null) return;

        // Try HTML table first (some brands use <table> inside the tab)
        extractNutritionFromTable(tabEl, p);

        // If table parse found protein, we're done
        if (p.getProteinPer100g() != null) return;

        // Fallback: split raw HTML on <br> — format per line:
        //   "Proteini    25g    83,3"   (last number = per-100g)
        String[] lines = tabEl.html().split("(?i)<br\\s*/?>", -1);

        boolean inNutritionSection = false;
        // Column order differs per brand: "na 30g | na 100g" (Ultimate) vs "100g | 30g" (QNT).
        // Decided by which figure comes first in the section header.
        boolean per100First = false;
        for (String rawLine : lines) {
            String line = Jsoup.parse(rawLine).text().replaceAll("[\\u00A0\\s]+", " ").trim();
            if (line.isBlank()) continue;
            String lower = line.toLowerCase();

            if (!inNutritionSection) {
                if (lower.contains("nutritivne vrednosti") || lower.contains("nutritional values")
                        || lower.contains("na 100g") || lower.contains("per 100g")
                        || lower.contains("tabela hranljivih") || lower.contains("nutritiona")) {
                    inNutritionSection = true;
                    per100First = isPer100ColumnFirst(line);
                }
                continue;
            }

            if ((lower.startsWith("proteini") || lower.startsWith("protein") || lower.startsWith("belančevine"))
                    && !lower.contains("koncentrat") && !lower.contains("izvor") && !lower.contains("od čega")) {
                Double val = extractPer100Number(line, per100First);
                // Sanity check: per-100g protein must be ≥20g for a protein product
                if (val != null && val >= 20 && val <= 95) p.setProteinPer100g(val);

            } else if ((lower.startsWith("masti") || lower.startsWith("fat") || lower.startsWith("lipidi")
                    || lower.startsWith("ukupne masti"))
                    && !lower.contains("zasić") && !lower.contains("trans") && !lower.contains("od čega")) {
                Double val = extractPer100Number(line, per100First);
                if (val != null && val >= 0 && val <= 100) p.setFatPer100g(val);

            } else if (lower.startsWith("šećeri") || lower.startsWith("seceri")
                    || lower.startsWith("sugar") || lower.startsWith("od čega šećeri")
                    || lower.startsWith("od toga šećeri")) {
                Double val = extractPer100Number(line, per100First);
                if (val != null && val >= 0 && val <= 100) p.setSugarPer100g(val);

            } else if (lower.startsWith("energij") || lower.startsWith("energy") || lower.startsWith("kalorij")) {
                Double kcal = extractPer100Kcal(line, per100First);
                if (kcal != null && kcal > 0 && kcal <= 900) p.setCaloriePer100g(kcal);
            }
        }
    }

    private void extractNutritionFromTable(Element tabEl, Product p) {
        for (Element row : tabEl.select("tr")) {
            Elements cells = row.select("td, th");
            if (cells.size() < 2) continue;
            String label = cells.first().text().replaceAll("[\\u00A0\\s]+", " ").trim().toLowerCase();
            // Last cell is per-100g value (table may have: label | per-serving | per-100g)
            String valueText = cells.last().text().replaceAll("[\\u00A0\\s]+", " ").trim();

            if ((label.startsWith("proteini") || label.startsWith("protein") || label.startsWith("belančevine"))
                    && !label.contains("od čega") && !label.contains("izvor")) {
                Double val = extractLastNumber(valueText);
                if (val != null && val >= 20 && val <= 95) p.setProteinPer100g(val);

            } else if ((label.startsWith("masti") || label.startsWith("fat") || label.startsWith("lipidi"))
                    && !label.contains("zasić") && !label.contains("trans") && !label.contains("od čega")) {
                Double val = extractLastNumber(valueText);
                if (val != null && val >= 0 && val <= 100) p.setFatPer100g(val);

            } else if (label.startsWith("šećeri") || label.startsWith("seceri")
                    || label.startsWith("sugar") || label.startsWith("od čega šećeri")) {
                Double val = extractLastNumber(valueText);
                if (val != null && val >= 0 && val <= 100) p.setSugarPer100g(val);

            } else if (label.startsWith("energij") || label.startsWith("energy") || label.startsWith("kalorij")) {
                Double kcal = extractLastKcal(valueText);
                if (kcal == null) kcal = extractLastNumber(valueText);
                if (kcal != null && kcal > 50 && kcal <= 900) p.setCaloriePer100g(kcal);
            }
        }
    }

    /** True when the first figure in a nutrition header ("Nutritivne vrednosti 100g 30g") is the 100g column. */
    private boolean isPer100ColumnFirst(String header) {
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*g?").matcher(header);
        return m.find() && Double.parseDouble(m.group(1).replace(",", ".")) == 100.0;
    }

    /** Per-100g figure of a nutrition row: first number when the 100g column comes first, else the last. */
    private Double extractPer100Number(String text, boolean per100First) {
        if (!per100First) return extractLastNumber(text);
        Matcher m = Pattern.compile("(\\d+[.,]\\d+|\\d+)").matcher(text);
        if (!m.find()) return null;
        try { return Double.parseDouble(m.group(1).replace(",", ".")); }
        catch (Exception ignored) { return null; }
    }

    private Double extractPer100Kcal(String text, boolean per100First) {
        if (!per100First) return extractLastKcal(text);
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(text);
        if (!m.find()) return null;
        try { return Double.parseDouble(m.group(1).replace(",", ".")); }
        catch (Exception ignored) { return null; }
    }

    /** Returns the last standalone number on a line (handles "83,3", "3.3g", "398kcal"). */
    private Double extractLastNumber(String text) {
        Matcher m = Pattern.compile("(\\d+[.,]\\d+|\\d+)").matcher(text);
        String last = null;
        while (m.find()) last = m.group(1);
        if (last == null) return null;
        try { return Double.parseDouble(last.replace(",", ".")); }
        catch (Exception ignored) { return null; }
    }

    // ── DB restoration helpers ───────────────────────────────────────────────────

    private void restoreNutritionFromDb(Product p) {
        productRepository.findByUrl(p.getUrl()).ifPresent(db -> {
            if (p.getProteinPer100g() == null) p.setProteinPer100g(db.getProteinPer100g());
            if (p.getFatPer100g() == null)     p.setFatPer100g(db.getFatPer100g());
            if (p.getSugarPer100g() == null)   p.setSugarPer100g(db.getSugarPer100g());
            if (p.getCaloriePer100g() == null) p.setCaloriePer100g(db.getCaloriePer100g());
            if (p.getProteinSource() == null)  p.setProteinSource(db.getProteinSource());
            if (p.getBrand() == null)          p.setBrand(db.getBrand());
        });
    }

    private void restoreFromDb(Product p) {
        productRepository.findByUrl(p.getUrl()).ifPresent(db -> {
            if (p.getPrice() == null || p.getPrice().isBlank()) p.setPrice(db.getPrice());
            p.setProteinPer100g(db.getProteinPer100g());
            p.setFatPer100g(db.getFatPer100g());
            p.setSugarPer100g(db.getSugarPer100g());
            p.setCaloriePer100g(db.getCaloriePer100g());
            p.setProteinSource(db.getProteinSource());
            p.setBrand(db.getBrand());
            if (p.getImageUrl() == null) p.setImageUrl(db.getImageUrl());
            if (p.getPrimaryWeightGrams() == null) p.setPrimaryWeightGrams(db.getPrimaryWeightGrams());
        });
    }

    // ── Parsing utilities ────────────────────────────────────────────────────────

    /** "10.200,00 RSD" → "10200.00" */
    private String parsePriceString(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.replaceAll("(?i)rsd", "")
                      .replaceAll("\\s", "")
                      .replace(".", "")   // thousands dot
                      .replace(",", "."); // decimal comma
        s = s.replaceAll("[^0-9.]", "").trim();
        return s.isBlank() ? null : s;
    }

    /** Returns the LAST kcal value from a line like "545kJ/129kcal    1664kJ/398kcal". */
    private Double extractLastKcal(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(text);
        String last = null;
        while (m.find()) last = m.group(1);
        if (last == null) return null;
        try { return Double.parseDouble(last.replace(",", ".")); }
        catch (Exception ignored) { return null; }
    }

    /**
     * Extracts weight in grams from the product name.
     * Handles: "2,39kg", "907g", "2.27 kg", "500 g"
     */
    private Double parseWeightFromName(String name) {
        if (name == null) return null;
        String n = name.toLowerCase();

        // kg pattern: "2,39kg", "2.27kg", "2 kg"
        Matcher kg = Pattern.compile("(\\d+[.,]\\d+|\\d+)\\s*kg").matcher(n);
        if (kg.find()) {
            try { return Double.parseDouble(kg.group(1).replace(",", ".")) * 1000; }
            catch (Exception ignored) {}
        }

        // g pattern: "907g", "500 g" — only if number is plausible supplement size (≥100g)
        Matcher g = Pattern.compile("(\\d{3,4})\\s*gr?\\b").matcher(n);
        if (g.find()) {
            try {
                double val = Double.parseDouble(g.group(1));
                if (val >= 100 && val <= 9999) return val;
            } catch (Exception ignored) {}
        }

        return null;
    }

    private String formatWeight(double grams) {
        if (grams >= 1000 && grams % 1000 == 0) return (int)(grams / 1000) + "kg";
        if (grams >= 1000) return String.format("%.2f", grams / 1000).replace(".", ",") + "kg";
        return (int) grams + "g";
    }

    // ── Playwright helpers ────────────────────────────────────────────────────────

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(30000));
                page.waitForTimeout(500 + ThreadLocalRandom.current().nextInt(700));
                return true;
            } catch (Exception e) {
                log.warn("[{}] Navigate retry {}/{} for {}: {}",
                        STORE_NAME, i + 1, maxRetries, url, e.getMessage());
                if (i < maxRetries - 1) safeSleep(2000L * (i + 1));
            }
        }
        return false;
    }

    private boolean isBlockedByFirewall(Page page) {
        try {
            String title = page.title();
            return title.contains("Cloudflare") || title.contains("Just a moment")
                    || title.contains("Attention Required") || title.contains("Access denied");
        } catch (Exception e) { return false; }
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
