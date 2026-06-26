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
 * Scrapes polleosport.hr (OpenCart with custom theme, fully SSR).
 * Category: /proteini/ — 9 pages, ~20 products per page.
 * Pagination: ?page=N. Products are server-side rendered — plain JSoup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PolleoSportScraper implements StoreScraper {

    private static final String STORE_NAME = "Polleo Sport";
    private static final String SITE_ORIGIN = "https://polleosport.hr";
    private static final String BASE_URL = SITE_ORIGIN + "/proteini/";
    private static final int MAX_DETAIL_FETCH_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    // Matches "Bjelančevine" or "Protein" followed by per-serving and per-100g values
    private static final Pattern PROTEIN_LABEL_PATTERN = Pattern.compile(
            "(?:Bjelančevine|Protein)[^\\d]*(\\d+[.,]?\\d*)\\s*g[^\\d]*(\\d+[.,]?\\d*)\\s*g",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    // Weight in slug or title: "908-g", "2270 g", "2.27 kg"
    private static final Pattern WEIGHT_PATTERN = Pattern.compile(
            "(\\d+[.,]?\\d*)\\s*kg|([1-9]\\d{2,4})\\s*g",
            Pattern.CASE_INSENSITIVE
    );
    // Price: "24,99 €" or "24.99€"
    private static final Pattern PRICE_PATTERN = Pattern.compile("[\\d]+[.,][\\d]+|[\\d]+");

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl() { return BASE_URL; }
    @Override public String getMarket() { return "hr"; }
    @Override public String getCurrency() { return "EUR"; }
    @Override public boolean usePlaywrightForListing() { return false; }

    // OpenCart pagination: ?page=N, next page link absent when on last page
    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        // Next arrow link present when more pages exist
        return doc.selectFirst("a[aria-label=Next], ul.pagination a[href*=page]:last-child:not(.disabled)") != null
                || doc.selectFirst("li.next:not(.disabled) a, .pagination a[href*=\"page=\"]") != null;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        // OpenCart product grid: div.product-layout or div.product-thumb containers
        Elements cards = doc.select("div.product-layout, div.product-thumb");
        // Deduplicate in case both selectors match the same element
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
            // Name and URL: .product-name a or .caption h4 a (OpenCart variations)
            Element nameAnchor = card.selectFirst(".product-name a, .caption h4 a, h4 a");
            if (nameAnchor == null) nameAnchor = card.selectFirst("a[href*='polleosport.hr'], a[href]:not([href='#'])");
            if (nameAnchor == null) return null;

            String name = nameAnchor.text().trim();
            if (name.isBlank()) {
                name = nameAnchor.attr("title").trim();
            }
            if (name.isBlank()) return null;

            String href = nameAnchor.attr("href");
            if (href.isBlank()) return null;
            String url = href.startsWith("http") ? href : SITE_ORIGIN + "/" + href.replaceFirst("^/", "");

            // Price: div.price text
            Element priceEl = card.selectFirst("div.price, .price");
            Double price = priceEl != null ? parseEuroPrice(priceEl.text()) : null;

            // Brand: div.brand
            String brand = null;
            Element brandEl = card.selectFirst("div.brand, .brand");
            if (brandEl != null) brand = brandEl.text().trim();

            // Image
            String imageUrl = null;
            Element img = card.selectFirst("img");
            if (img != null) {
                imageUrl = img.attr("src");
                if (imageUrl.isBlank()) imageUrl = img.attr("data-src");
            }

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(url);
            if (price != null) p.setPrice(String.valueOf(price));
            if (brand != null && !brand.isBlank()) p.setBrand(brand);
            if (imageUrl != null && !imageUrl.isBlank()) p.setImageUrl(imageUrl);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing card: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private Double parseEuroPrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String cleaned = raw.replaceAll("[^\\d,.]", "").replace(",", ".").trim();
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException e) {
            Matcher m = PRICE_PATTERN.matcher(raw);
            if (m.find()) try { return Double.parseDouble(m.group().replace(",", ".")); } catch (NumberFormatException ignored) {}
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
                log.info("[{}] Enriched '{}'", STORE_NAME, stub.getName());
            } catch (Exception e) {
                log.error("[{}] Error enriching '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(2000 + ThreadLocalRandom.current().nextLong(2000));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p, boolean skipNutrition) {
        // Full product title from h1
        Element h1 = doc.selectFirst("h1, h2.product-name");
        if (h1 != null && !h1.text().isBlank()) p.setName(ProductNameCleaner.clean(h1.text().trim()));

        // Package weight from product name (e.g. "1st Whey, 908 g")
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) {
            Double weight = extractWeightFromName(p.getName());
            if (weight != null) p.setPrimaryWeightGrams(weight);
        }

        // Description
        Element descEl = doc.selectFirst("#tab-description, .product-description, div[id*=description]");
        if (descEl != null && !descEl.text().isBlank()) p.setDescription(descEl.text().trim());

        if (!skipNutrition) {
            extractProteinFromText(doc, p);
            baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
        }
    }

    /**
     * Polleo Sport renders nutrition as bold label + value text (not an HTML table).
     * Strategy: find "Bjelančevine" label and capture the 100g value (second number).
     */
    private void extractProteinFromText(Document doc, Product p) {
        String pageText = doc.text();

        // Pattern: "Bjelančevine 22 g 73 g" — first is per-serving, second is per-100g
        Matcher m = PROTEIN_LABEL_PATTERN.matcher(pageText);
        if (m.find()) {
            try {
                double perServing = Double.parseDouble(m.group(1).replace(",", "."));
                double per100g = Double.parseDouble(m.group(2).replace(",", "."));
                if (per100g > 30 && per100g <= 100) {
                    p.setProteinPer100g(per100g);
                    log.debug("[{}] '{}' protein per 100g: {}g", STORE_NAME, p.getName(), per100g);
                } else if (perServing > 30 && perServing <= 100) {
                    // Fallback: maybe only per-100g value is present
                    p.setProteinPer100g(perServing);
                }
            } catch (NumberFormatException ignored) {}
        }

        // Fallback: NutritionParserService regex on description
        if (p.getProteinPer100g() == null && p.getDescription() != null && !p.getDescription().isBlank()) {
            Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }
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

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
