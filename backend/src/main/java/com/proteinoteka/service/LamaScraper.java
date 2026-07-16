package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.WeightParser;
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
public class LamaScraper implements StoreScraper {

    private static final String STORE_NAME  = "Lama";
    private static final String BASE_URL    = "https://www.lama.rs";
    private static final String LISTING_URL = BASE_URL + "/proteini-i-gejneri";

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher    baseEnricher;
    private final WeightParser           weightParser;

    @Override public String  getStoreName()            { return STORE_NAME; }
    @Override public String  getBaseUrl()              { return LISTING_URL; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public boolean hasNextPage(Document doc) {
        return false; // lama.rs shows all products on a single page
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
        Elements cards = doc.select("div.shopBoxProdN");

        for (Element card : cards) {
            // Skip out-of-stock items
            if (card.selectFirst("div.shopBoxTag1") != null) continue;

            Element linkEl = card.selectFirst("a[href$=.html]");
            if (linkEl == null) continue;
            String href = linkEl.attr("href").trim();
            String url  = href.startsWith("http") ? href : BASE_URL + href;

            Product p = new Product();
            p.setUrl(url);

            Element nameEl = card.selectFirst("p.pTl");
            if (nameEl != null) p.setName(nameEl.text().trim());
            if (p.getName() == null || p.getName().isBlank()) continue;

            Element weightEl = card.selectFirst("p.pTxt");
            if (weightEl != null) {
                String weightText = weightEl.text().trim();
                Double grams = parseWeightToGrams(weightText);
                if (grams != null) {
                    p.setPrimaryWeightGrams(grams);
                    p.getPackage_weight().add(weightText);
                }
            }

            Element priceBox = card.selectFirst("div.priceProdN");
            if (priceBox != null) {
                Elements ps = priceBox.select("p");
                if (!ps.isEmpty()) {
                    String raw = ps.last().text().trim();
                    p.setPrice(parsePriceString(raw));
                }
            }

            Element img = card.selectFirst("img.shopBoxProdIcn");
            if (img != null) {
                String src = img.attr("src").trim();
                if (!src.isBlank()) {
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
                    extractNutritionFromDivTable(doc, p);

                    if (p.getProteinPer100g() == null) {
                        Element descEl = doc.selectFirst("div.productDesc, div.prodDesc");
                        if (descEl != null) {
                            Double protein = nutritionParser.extractProteinPer100g(descEl.text());
                            if (protein != null) p.setProteinPer100g(protein);
                        }
                    }

                    baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
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
        Element el = doc.selectFirst("p.productBoxTl1");
        if (el != null) {
            String brand = el.text().trim();
            if (!brand.isBlank()) p.setBrand(brand);
        }
    }

    private void enrichPriceFromDetail(Document doc, Product p) {
        Element priceBox = doc.selectFirst("div.priceProduct1");
        if (priceBox == null) return;
        Elements ps = priceBox.select("p");
        if (ps.isEmpty()) return;
        String parsed = parsePriceString(ps.last().text().trim());
        if (parsed != null && !parsed.isBlank()) p.setPrice(parsed);
    }

    private void enrichDescription(Document doc, Product p) {
        Element el = doc.selectFirst("div.productDescript2");
        if (el != null) {
            String text = el.text().trim();
            if (!text.isBlank()) p.setDescription(text);
        }
    }

    private void enrichImageFromDetail(Document doc, Product p) {
        Element meta = doc.selectFirst("meta[property=og:image]");
        if (meta != null) {
            String content = meta.attr("content").trim();
            if (!content.isBlank()) { p.setImageUrl(content); return; }
        }
        Element img = doc.selectFirst("img[src*=xl-slike]");
        if (img != null) {
            String src = img.attr("src").trim();
            if (!src.isBlank()) {
                if (!src.startsWith("http")) src = BASE_URL + src;
                p.setImageUrl(src);
            }
        }
    }

    // ── Nutrition extraction ─────────────────────────────────────────────────────

    /**
     * lama.rs uses a div-based layout instead of HTML tables:
     *   div.tableRow2 > div.tableColL2 (label) | div.tableColM1a (per 100g) | div.tableColM1b (per serving)
     */
    private void extractNutritionFromDivTable(Document doc, Product p) {
        Elements rows = doc.select("div.tableRow2");
        if (rows.isEmpty()) return;

        for (Element row : rows) {
            Element labelEl  = row.selectFirst("div.tableColL2");
            Element per100El = row.selectFirst("div.tableColM1a");
            if (labelEl == null || per100El == null) continue;

            String label   = labelEl.text().trim().toLowerCase();
            String rawCell = per100El.text().trim();

            if ((label.contains("proteini") || label.equals("protein") || label.contains("belančevine"))
                    && !label.contains("koncentrat") && !label.contains("izvor") && !label.contains("od čega")) {
                Double val = extractGrams(rawCell);
                if (val != null && val > 0 && val <= 95) p.setProteinPer100g(val);

            } else if ((label.contains("masti") || label.equals("fat"))
                    && !label.contains("zasićene") && !label.contains("trans") && !label.contains("od čega")) {
                Double val = extractGrams(rawCell);
                if (val != null && val <= 100) p.setFatPer100g(val);

            } else if (label.contains("šećeri") || label.contains("seceri")
                    || label.equals("sugar") || label.equals("sugars")) {
                Double val = extractGrams(rawCell);
                if (val != null && val <= 100) p.setSugarPer100g(val);

            } else if (label.contains("energetska") || label.contains("energij")
                    || label.contains("kalorij") || label.contains("energy")) {
                Double kcal = extractKcal(rawCell);
                if (kcal != null && kcal >= 200 && kcal <= 900) p.setCaloriePer100g(kcal);
            }
        }
    }

    // ── Parsing utilities ─────────────────────────────────────────────────────────

    /** Serbian price "7.400,00 RSD" → "7400.00" */
    private String parsePriceString(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.replaceAll("(?i)rsd", "")
                      .replaceAll("\\s", "")
                      .replace(".", "")   // thousands separator
                      .replace(",", "."); // decimal comma → dot
        s = s.replaceAll("[^0-9.]", "").trim();
        return s.isBlank() ? null : s;
    }

    /** Extract numeric grams from "70 g", "2,2 g" */
    private Double extractGrams(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*g").matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (Exception ignored) {}
        }
        return null;
    }

    /** Extract kcal from "1595 kJ/377 kcal" or "377 kcal" */
    private Double extractKcal(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (Exception ignored) {}
        }
        return null;
    }

    private Double parseWeightToGrams(String text) {
        return weightParser.parse(text);
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
