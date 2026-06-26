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
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scrapes proteka.hr (custom "kanuni.hr" e-commerce, Alpine.js frontend, fully SSR).
 * All protein products are rendered server-side on a single category page — no pagination.
 * Product data is embedded in div[data-filterable-item] attributes; no JS execution needed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProtekaHrScraper implements StoreScraper {

    private static final String STORE_NAME = "Proteka";
    private static final String BASE_URL = "https://www.proteka.hr/c/proteini";
    private static final String SITE_ORIGIN = "https://www.proteka.hr";
    private static final int MAX_DETAIL_FETCH_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    // Matches price strings like "69,90" or "69.90" — European decimal comma/dot
    private static final Pattern PRICE_PATTERN = Pattern.compile("[\\d]+[,.]?[\\d]*");

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl() { return BASE_URL; }
    @Override public String getMarket() { return "hr"; }
    @Override public String getCurrency() { return "EUR"; }
    @Override public boolean usePlaywrightForListing() { return false; }

    // All products on one page — no pagination
    @Override public boolean hasNextPage(Document doc) { return false; }
    @Override public String buildPageUrl(int page) { return BASE_URL; }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, java.util.Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        Elements cards = doc.select("div[data-filterable-item]");
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
            // Product name: h5.product-title > a
            Element nameEl = card.selectFirst("h5.product-title a, .product-title a");
            if (nameEl == null) return null;
            String name = nameEl.text().trim();
            if (name.isBlank()) return null;

            // Product URL: anchor inside the card
            Element anchor = card.selectFirst("a[href]");
            if (anchor == null) return null;
            String href = anchor.attr("href");
            if (href.isBlank()) return null;
            String url = href.startsWith("http") ? href : SITE_ORIGIN + href;

            // Price: data-price attribute on the outer filterable div (clean decimal string)
            String priceAttr = card.attr("data-price").trim();
            Double price = parsePrice(priceAttr);

            // Image: img.lazyload[data-src]
            String imageUrl = null;
            Element img = card.selectFirst("img[data-src], img[src]");
            if (img != null) {
                imageUrl = img.attr("data-src");
                if (imageUrl.isBlank()) imageUrl = img.attr("src");
            }

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(url);
            if (price != null) p.setPrice(String.valueOf(price));
            if (imageUrl != null && !imageUrl.isBlank()) p.setImageUrl(imageUrl);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing card: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private Double parsePrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            // data-price is already a clean decimal (e.g. "69.90")
            return Double.parseDouble(raw.replace(",", "."));
        } catch (NumberFormatException e) {
            // Fallback: extract first number from string
            Matcher m = PRICE_PATTERN.matcher(raw);
            if (m.find()) {
                try { return Double.parseDouble(m.group().replace(",", ".")); }
                catch (NumberFormatException ignored) {}
            }
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
                    log.error("[{}] {} consecutive failures — stopping enrichment", STORE_NAME, consecutiveFailures);
                    return result;
                }
                continue;
            }
            consecutiveFailures = 0;

            try {
                enrichProduct(doc, stub, skipUrls.contains(stub.getUrl()));
                result.add(stub);
                log.info("[{}] Enriched '{}'", STORE_NAME, stub.getName());
            } catch (Exception e) {
                log.error("[{}] Error enriching '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(2000 + ThreadLocalRandom.current().nextLong(2000));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p, boolean skipNutrition) {
        // Brand — look for brand link or meta
        Element brandEl = doc.selectFirst("[itemprop=brand] [itemprop=name], .product-brand a, .brand-name");
        if (brandEl != null) p.setBrand(brandEl.text().trim());

        // Package weight — extract from product name via regex
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) {
            Double weight = extractWeightFromName(p.getName());
            if (weight != null) p.setPrimaryWeightGrams(weight);
        }

        // Description — look for description block
        Element descEl = doc.selectFirst(".product-description, [itemprop=description], .description");
        if (descEl != null) {
            String desc = descEl.text().trim();
            if (!desc.isBlank()) p.setDescription(desc);
        }

        // Nutrition table (standard HTML table with per-100g values)
        if (!skipNutrition) {
            extractNutritionFromTable(doc, p);
            baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
        }
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        // Proteka uses standard HTML nutrition tables
        for (Element row : doc.select("table tr, .nutrition-table tr")) {
            String label = row.select("td:first-child, th:first-child").text().toLowerCase();
            String value = row.select("td:last-child, td:nth-child(2)").text();

            if (label.contains("proteini") || label.contains("protein")) {
                Double v = parseNutritionValue(value);
                if (v != null && v > 0 && v <= 100) p.setProteinPer100g(v);
            } else if (label.contains("šeće") || label.contains("sece") || label.contains("šećer") || label.contains("ugljikohid")) {
                if (label.contains("šeće") || label.contains("sece") || label.contains("šećer")) {
                    Double v = parseNutritionValue(value);
                    if (v != null && v >= 0) p.setSugarPer100g(v);
                }
            } else if (label.contains("masti") || label.contains("masnoće") || label.contains("ukupne masti")) {
                Double v = parseNutritionValue(value);
                if (v != null && v >= 0) p.setFatPer100g(v);
            } else if (label.contains("energij") || label.contains("kalorij") || label.contains("kcal")) {
                Double v = parseNutritionValue(value);
                if (v != null && v > 0) p.setCaloriePer100g(v);
            }
        }
    }

    private Double parseNutritionValue(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher m = Pattern.compile("[\\d]+[,.]?[\\d]*").matcher(raw);
        if (!m.find()) return null;
        try { return Double.parseDouble(m.group().replace(",", ".")); }
        catch (NumberFormatException e) { return null; }
    }

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_DETAIL_FETCH_RETRIES; attempt++) {
            try {
                return httpClient.connection(url)
                        .header("Accept-Language", "hr-HR,hr;q=0.9,en;q=0.8")
                        .get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}", STORE_NAME, attempt, MAX_DETAIL_FETCH_RETRIES, url, e.getMessage());
                safeSleep(3000L * attempt);
            }
        }
        return null;
    }

    private static final Pattern WEIGHT_PATTERN = Pattern.compile("(\\d+[.,]?\\d*)\\s*kg|([1-9]\\d{2,4})\\s*g", Pattern.CASE_INSENSITIVE);

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

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
