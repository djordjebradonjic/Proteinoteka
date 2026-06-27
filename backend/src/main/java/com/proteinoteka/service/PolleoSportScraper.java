package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.ProductNameCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scrapes polleosport.hr — custom SSR platform (not WooCommerce/OpenCart).
 * No JS needed → plain JSoup, no proxy needed → zero iProyal credit usage.
 * Products: /proteini/ with ?page=N pagination. Each size variant is a separate URL.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PolleoSportScraper implements StoreScraper {

    private static final String STORE_NAME = "Polleo Sport";
    private static final String SITE_ORIGIN = "https://polleosport.hr";
    private static final String BASE_URL = SITE_ORIGIN + "/proteini/";
    private static final int MAX_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    private static final Pattern WEIGHT_PATTERN = Pattern.compile(
            "(\\d+[.,]?\\d*)\\s*kg|(\\d{3,5})\\s*g",
            Pattern.CASE_INSENSITIVE
    );

    private volatile int productLimit = Integer.MAX_VALUE;

    public void setProductLimit(int limit)  { this.productLimit = limit; }
    public void resetProductLimit()         { this.productLimit = Integer.MAX_VALUE; }

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl()   { return BASE_URL; }
    @Override public String getMarket()    { return "hr"; }
    @Override public String getCurrency()  { return "EUR"; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        // Next-arrow link (">") is absent on the last page
        for (Element a : doc.select("ul.pagination a, .pagination a")) {
            String text = a.text().trim();
            String href = a.attr("href");
            if ((text.equals(">") || text.equals("›") || text.contains(">"))
                    && href.contains("page=")) {
                return true;
            }
        }
        return false;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        Elements cards = doc.select("div.product-item");
        log.info("[{}] Found {} product cards on listing page", STORE_NAME, cards.size());

        for (Element card : cards) {
            Product p = parseCard(card);
            if (p != null) stubs.add(p);
        }

        return enrichWithDetails(stubs, skipUrls);
    }

    // -------------------- Listing parsing --------------------

    private Product parseCard(Element card) {
        try {
            Element nameAnchor = card.selectFirst("h3 a, h2 a");
            if (nameAnchor == null) return null;

            String name = nameAnchor.text().trim();
            if (name.isBlank()) return null;

            String href = nameAnchor.attr("href").trim();
            if (href.isBlank()) return null;
            String url = href.startsWith("http") ? href : SITE_ORIGIN + "/" + href.replaceFirst("^/", "");

            Element priceEl = card.selectFirst("span.price");
            Double price = priceEl != null ? parseEuroPrice(priceEl.text()) : null;

            String brand = null;
            Element brandEl = card.selectFirst("div.product-brand, span.brand, .brand");
            if (brandEl != null) brand = brandEl.text().trim();

            String imageUrl = null;
            Element img = card.selectFirst("img");
            if (img != null) {
                imageUrl = img.attr("src");
                if (imageUrl.isBlank()) imageUrl = img.attr("data-src");
                // Strip size param — keep full-size image
                if (imageUrl.contains("?size=")) imageUrl = imageUrl.substring(0, imageUrl.indexOf("?size="));
            }

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(url);
            if (price != null) p.setPrice(String.valueOf(price));
            if (brand != null && !brand.isBlank()) p.setBrand(brand);
            if (imageUrl != null && !imageUrl.isBlank()) p.setImageUrl(imageUrl);

            Double weight = extractWeightFromName(p.getName());
            if (weight != null) {
                p.setPrimaryWeightGrams(weight);
                String weightLabel = weight >= 1000
                        ? (weight % 1000 == 0 ? ((int)(double)(weight/1000)) + " kg" : (weight/1000) + " kg")
                        : ((int)(double) weight) + " g";
                p.getPackage_weight().add(weightLabel);
            }

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing card: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    // -------------------- Detail page enrichment --------------------

    private List<Product> enrichWithDetails(List<Product> stubs, Set<String> skipUrls) {
        List<Product> result = new ArrayList<>();
        int consecutiveFailures = 0;

        for (Product stub : stubs) {
            if (stub.getUrl() == null || stub.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(stub.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, stub.getName());
                continue;
            }

            Document doc = fetchDetailPage(stub.getUrl());
            if (doc == null) {
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    log.error("[{}] {} consecutive failures — stopping", STORE_NAME, consecutiveFailures);
                    return result;
                }
                continue;
            }
            consecutiveFailures = 0;

            try {
                enrichProduct(doc, stub, skipUrls.contains(stub.getUrl()));
                result.add(stub);
                if (result.size() >= productLimit) {
                    log.info("[{}] Reached product limit ({}) — stopping", STORE_NAME, productLimit);
                    return result;
                }
                log.info("[{}] '{}' → price={}, weight={}g, protein={}, fat={}, sugar={}, cal={}",
                        STORE_NAME, stub.getName(), stub.getPrice(),
                        stub.getPrimaryWeightGrams() != null ? (long) Math.round(stub.getPrimaryWeightGrams()) : "?",
                        stub.getProteinPer100g(), stub.getFatPer100g(),
                        stub.getSugarPer100g(), stub.getCaloriePer100g());
            } catch (Exception e) {
                log.error("[{}] Error enriching '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(1500 + ThreadLocalRandom.current().nextLong(1500));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p, boolean skipNutrition) {
        // Title from h1 (may include flavour variant: "1st Whey, 908 g - Dark Chocolate")
        Element h1 = doc.selectFirst("h1");
        if (h1 != null && !h1.text().isBlank()) {
            p.setName(ProductNameCleaner.clean(h1.text().trim()));
        }

        // Re-extract weight from (possibly updated) name
        if (p.getPrimaryWeightGrams() == null || p.getPrimaryWeightGrams() == 0) {
            Double weight = extractWeightFromName(p.getName());
            if (weight != null) p.setPrimaryWeightGrams(weight);
        }

        // Price from detail page (in case listing price was 0 or missing)
        enrichPriceFromDetailPage(doc, p);

        // Brand
        Element brandEl = doc.selectFirst(".brand-info a, .product-brand a, .brand a");
        if (brandEl != null && !brandEl.text().isBlank()) p.setBrand(brandEl.text().trim());

        // Description
        Element descEl = doc.selectFirst("#tab-description, .product-description, div[id*=description]");
        if (descEl != null && !descEl.text().isBlank()) p.setDescription(descEl.text().trim());

        // Image (full resolution from detail page)
        if (p.getImageUrl() == null || p.getImageUrl().isBlank()) {
            Element img = doc.selectFirst(".product-image img, .gallery img, .product-photo img");
            if (img != null) {
                String src = img.attr("src");
                if (src.isBlank()) src = img.attr("data-src");
                if (!src.isBlank()) p.setImageUrl(src);
            }
        }

        if (!skipNutrition) {
            extractNutritionFromTable(doc, p);
            baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
        }
    }

    // -------------------- Nutrition table parsing --------------------

    /**
     * Polleo Sport uses an HTML table with columns: Nutrient | per serving | per 100 g.
     * We always target the per-100 g column.
     */
    private void extractNutritionFromTable(Document doc, Product p) {
        for (Element table : doc.select("table")) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini") && !tableText.contains("bjelančevine")
                    && !tableText.contains("protein")) continue;

            int per100gCol = findPer100gColumn(table);
            if (per100gCol < 0) {
                // No column header found — try per-serving conversion
                extractNutritionFallback(table, p);
                if (p.getProteinPer100g() != null) return;
                continue;
            }

            parseNutritionRows(table, p, per100gCol);
            if (p.getProteinPer100g() != null) return;
        }

        // Text-based fallback using NutritionParserService
        if (p.getProteinPer100g() == null && p.getDescription() != null) {
            Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }
    }

    private int findPer100gColumn(Element table) {
        for (Element row : table.select("tr")) {
            Elements cells = row.select("th, td");
            for (int i = 0; i < cells.size(); i++) {
                String text = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                if (text.contains("100g") || text.equals("100")) return i;
            }
        }
        return -1;
    }

    private void parseNutritionRows(Element table, Product p, int per100gCol) {
        for (Element row : table.select("tr")) {
            Elements cells = row.select("td");
            if (cells.size() <= per100gCol) continue;

            String label = cells.get(0).text().trim().toLowerCase();
            String rawCell = cells.get(per100gCol).text().trim();

            if (label.contains("energij") || label.contains("energy")) {
                Matcher kcalM = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(rawCell);
                if (kcalM.find()) {
                    try { p.setCaloriePer100g(Double.parseDouble(kcalM.group(1).replace(",", "."))); }
                    catch (NumberFormatException ignored) {}
                }
                continue;
            }

            double value = parseFirstNumber(rawCell);
            if (value <= 0 || value > 10000) continue;

            if ((label.contains("protein") || label.contains("bjelančevine"))
                    && !label.contains("koncentrat") && !label.contains("izolat")) {
                if (value <= 95) p.setProteinPer100g(value);
            } else if ((label.equals("masti") || label.equals("fat") || label.equals("ukupne masti"))
                    && !label.contains("zasić")) {
                if (value <= 100) p.setFatPer100g(value);
            } else if (label.contains("šećeri") || label.contains("seceri") || label.contains("sugar")) {
                if (value <= 100) p.setSugarPer100g(value);
            }
        }
    }

    /**
     * Fallback for tables without a "100 g" column header —
     * find serving size and scale values to per-100g.
     */
    private void extractNutritionFallback(Element table, Product p) {
        String tableText = table.text();
        Double servingSize = null;
        Matcher sm = Pattern.compile("(\\d+[.,]?\\d*)\\s*g", Pattern.CASE_INSENSITIVE).matcher(tableText);
        // Take first plausible serving size (20–60 g)
        while (sm.find()) {
            try {
                double v = Double.parseDouble(sm.group(1).replace(",", "."));
                if (v >= 20 && v <= 60) { servingSize = v; break; }
            } catch (NumberFormatException ignored) {}
        }
        if (servingSize == null) return;

        double serving = servingSize;
        for (Element row : table.select("tr")) {
            Elements cells = row.select("td");
            if (cells.size() < 2) continue;
            String label = cells.get(0).text().toLowerCase();
            double value = parseFirstNumber(cells.get(1).text());
            if (value <= 0) continue;

            double per100g = Math.round((value / serving * 100) * 10.0) / 10.0;
            if ((label.contains("protein") || label.contains("bjelančevine")) && per100g <= 95)
                p.setProteinPer100g(per100g);
            else if ((label.equals("masti") || label.equals("fat")) && per100g <= 100)
                p.setFatPer100g(per100g);
            else if ((label.contains("šećeri") || label.contains("sugar")) && per100g <= 100)
                p.setSugarPer100g(per100g);
        }
    }

    // -------------------- Helpers --------------------

    private void enrichPriceFromDetailPage(Document doc, Product p) {
        if (p.getPrice() != null && !p.getPrice().isBlank() && !p.getPrice().equals("0.0")) return;
        Element priceEl = doc.selectFirst("span.price, .product-price span, .price");
        if (priceEl != null) {
            Double price = parseEuroPrice(priceEl.text());
            if (price != null && price > 0) p.setPrice(String.valueOf(price));
        }
    }

    private Double parseEuroPrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // "24,99 €" or "24.99€" — strip currency, convert comma decimal
        String cleaned = raw.replaceAll("[^\\d,.]", "").trim();
        // If both comma and dot present, comma is thousands sep → remove it
        if (cleaned.contains(",") && cleaned.contains(".")) {
            cleaned = cleaned.replace(",", "");
        } else {
            cleaned = cleaned.replace(",", ".");
        }
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException e) { return null; }
    }

    private double parseFirstNumber(String text) {
        if (text == null || text.isBlank()) return 0;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)").matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (NumberFormatException ignored) {}
        }
        return 0;
    }

    private Double extractWeightFromName(String name) {
        if (name == null) return null;
        Matcher m = WEIGHT_PATTERN.matcher(name);
        while (m.find()) {
            try {
                if (m.group(1) != null) return Double.parseDouble(m.group(1).replace(",", ".")) * 1000;
                if (m.group(2) != null) {
                    double g = Double.parseDouble(m.group(2));
                    if (g >= 100) return g;
                }
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Direct JSoup — no proxy needed, polleosport.hr is plain SSR
                return org.jsoup.Jsoup.connect(url)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                        .header("Accept-Language", "hr-HR,hr;q=0.9,en;q=0.8")
                        .referrer(BASE_URL)
                        .timeout(15000)
                        .get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}", STORE_NAME, attempt, MAX_RETRIES, url, e.getMessage());
                safeSleep(3000L * attempt);
            }
        }
        return null;
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
