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

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher    baseEnricher;
    private final ProductRepository      productRepository;
    private final PriceParser            priceParser;

    @Override public String  getStoreName()            { return STORE_NAME; }
    @Override public String  getBaseUrl()              { return LISTING_URL; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public boolean hasNextPage(Document doc) {
        // All products load on one page via ?limit=100
        return false;
    }

    @Override
    public String buildPageUrl(int page) {
        return LISTING_URL;
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
            enrichWithDetails(page, products, skipUrls);
        }

        return products;
    }

    // ── Listing parsing ──────────────────────────────────────────────────────────

    private List<Product> parseListingPage(Document doc) {
        List<Product> products = new ArrayList<>();
        Elements cards = doc.select("div.product-layout");

        for (Element card : cards) {
            Element linkEl = card.selectFirst("div.caption h4 a");
            if (linkEl == null) continue;

            String href = linkEl.attr("href").trim();
            // Strip ?limit=100 from listing URLs to get canonical product URL
            int q = href.indexOf('?');
            String url = q >= 0 ? href.substring(0, q) : href;
            if (url.isBlank()) continue;
            if (!url.startsWith("http")) url = BASE_URL + url;

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

            Element priceEl = card.selectFirst("span.price-new");
            if (priceEl != null) p.setPrice(parsePriceString(priceEl.text()));

            // Listing image — upgrade to 600x600 by replacing thumbnail suffix
            Element img = card.selectFirst("img.img-responsive");
            if (img != null) {
                String src = img.attr("src").trim();
                if (!src.isBlank()) {
                    src = src.replace("-228x228.", "-600x600.");
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
        int count = 0;

        for (Product p : products) {
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
                long sleep = 5000 + ThreadLocalRandom.current().nextLong(5000);
                log.info("[{}] Sleeping {}s before '{}'...", STORE_NAME, sleep / 1000, p.getName());
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
                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichPriceFromDetail(doc, p);
                enrichImageFromDetail(doc, p);
                enrichDescription(doc, p);

                if (!skipUrls.contains(p.getUrl())) {
                    extractNutritionFromTable(doc, p);

                    if (p.getProteinPer100g() == null && p.getDescription() != null) {
                        Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
                        if (protein != null) p.setProteinPer100g(protein);
                    }

                    baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
                } else {
                    restoreNutritionFromDb(p);
                }

                log.info("[{}] Enriched '{}' {}g → price={}, brand={}, protein={}g/100g",
                        STORE_NAME, p.getName(),
                        p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) : "?",
                        p.getPrice(), p.getBrand(), p.getProteinPer100g());

                count++;
                if (count % 10 == 0) {
                    long batchSleep = 40000 + ThreadLocalRandom.current().nextLong(20000);
                    log.info("[{}] Batch pause {}s after {} products", STORE_NAME, batchSleep / 1000, count);
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
        // OpenCart puts manufacturer in a <ul> list with "Proizvođač:" label
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
        Element el = doc.selectFirst("div.price-new, span.price-new");
        if (el != null) {
            String price = parsePriceString(el.text());
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
        Element el = doc.selectFirst("#tab-description");
        if (el == null) el = doc.selectFirst("div.tab-content");
        if (el != null) {
            String text = el.text().trim();
            if (!text.isBlank()) p.setDescription(text);
        }
    }

    // ── Nutrition extraction ─────────────────────────────────────────────────────

    private void extractNutritionFromTable(Document doc, Product p) {
        for (Element table : doc.select("table")) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini") && !tableText.contains("protein")) continue;

            Elements rows = table.select("tr");
            if (rows.isEmpty()) continue;

            // Detect which column holds per-100g values
            int per100gCol = detectPer100gColumn(rows.get(0));

            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() <= per100gCol) continue;

                String label    = cells.get(0).text().trim().toLowerCase();
                String rawValue = cells.get(per100gCol).text().trim();

                if ((label.contains("proteini") || label.equals("protein") || label.contains("belančevine"))
                        && !label.contains("koncentrat") && !label.contains("izvor") && !label.contains("od čega")) {
                    Double val = extractNumericGrams(rawValue);
                    if (val != null && val > 0 && val <= 95) p.setProteinPer100g(val);

                } else if ((label.contains("masti") || label.equals("fat") || label.equals("lipidi"))
                        && !label.contains("zasić") && !label.contains("trans") && !label.contains("od čega")) {
                    Double val = extractNumericGrams(rawValue);
                    if (val != null && val >= 0 && val <= 100) p.setFatPer100g(val);

                } else if (label.contains("šećeri") || label.contains("seceri")
                        || label.equals("sugar") || label.equals("sugars")
                        || (label.contains("ugljeni hidrati") && label.contains("šećer"))) {
                    Double val = extractNumericGrams(rawValue);
                    if (val != null && val >= 0 && val <= 100) p.setSugarPer100g(val);

                } else if (label.contains("energi") || label.contains("kalorij") || label.contains("energy")) {
                    Double kcal = extractKcal(rawValue);
                    if (kcal != null && kcal > 0 && kcal <= 900) p.setCaloriePer100g(kcal);
                }
            }

            if (p.getProteinPer100g() != null) break;
        }
    }

    private int detectPer100gColumn(Element headerRow) {
        Elements cells = headerRow.select("th, td");
        for (int i = 0; i < cells.size(); i++) {
            String text = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
            if (text.contains("100g") || text.contains("na100") || text.contains("per100")) {
                return i;
            }
        }
        // Default: second data column (index 2 in a 3-column table)
        return cells.size() >= 3 ? 2 : 1;
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

    /** Extract grams from "83,3g", "25 g", "1.5g" */
    private Double extractNumericGrams(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*g(?!\\w)", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (Exception ignored) {}
        }
        // Plain number without unit (some tables omit "g" in data cells)
        Matcher m2 = Pattern.compile("^(\\d+[.,]?\\d*)$").matcher(text.trim());
        if (m2.find()) {
            try { return Double.parseDouble(m2.group(1).replace(",", ".")); }
            catch (Exception ignored) {}
        }
        return null;
    }

    /** Extract kcal from "1664kJ/398kcal", "398 kcal", "1664kJ" */
    private Double extractKcal(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (Exception ignored) {}
        }
        return null;
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
