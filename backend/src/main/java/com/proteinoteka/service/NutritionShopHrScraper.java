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
 * Scrapes nutrition-shop.hr (WooCommerce 9.8.6 + Elementor Pro, fully SSR).
 * Category: /kategorija-proizvoda/proizvodi/proteini/
 * Pagination: standard WooCommerce /page/N/ — continues until no next-page link.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NutritionShopHrScraper implements StoreScraper {

    private static final String STORE_NAME = "Nutrition Shop HR";
    private static final String SITE_ORIGIN = "https://nutrition-shop.hr";
    private static final String BASE_URL = SITE_ORIGIN + "/kategorija-proizvoda/proizvodi/proteini/";
    private static final int MAX_DETAIL_FETCH_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl() { return BASE_URL; }
    @Override public String getMarket() { return "hr"; }
    @Override public String getCurrency() { return "EUR"; }
    @Override public boolean usePlaywrightForListing() { return false; }

    // Standard WooCommerce /page/N/ pattern
    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "page/" + (page + 1) + "/";
    }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("a.next.page-numbers") != null;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        // Standard WooCommerce product grid
        Elements cards = doc.select("ul.products li.product");
        log.info("[{}] Found {} products on listing page", STORE_NAME, cards.size());

        for (Element card : cards) {
            Product p = parseCard(card);
            if (p != null) stubs.add(p);
        }

        return enrichWithDetails(stubs, skipUrls);
    }

    // -------------------- Listing parsing --------------------

    private Product parseCard(Element card) {
        try {
            // Product URL and name
            Element anchor = card.selectFirst("a.woocommerce-LoopProduct-link");
            if (anchor == null) return null;
            String url = anchor.attr("href");
            if (url.isBlank()) return null;

            Element nameEl = card.selectFirst("h2.woocommerce-loop-product__title");
            if (nameEl == null) return null;
            String name = nameEl.text().trim();
            if (name.isBlank()) return null;

            // Price — three cases: single, on-sale (ins/del), variable range (two amounts)
            Double price = extractListingPrice(card);

            // Image
            String imageUrl = null;
            Element img = card.selectFirst("img.attachment-woocommerce_thumbnail, img.wp-post-image");
            if (img != null) {
                imageUrl = img.attr("src");
                String srcset = img.attr("srcset");
                if (!srcset.isBlank()) {
                    // Take the largest image from srcset
                    String[] parts = srcset.split(",");
                    String last = parts[parts.length - 1].trim();
                    String candidate = last.split("\\s+")[0];
                    if (!candidate.isBlank()) imageUrl = candidate;
                }
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

    private Double extractListingPrice(Element card) {
        // On-sale: current price in <ins>
        Element insPriceEl = card.selectFirst("span.price ins .woocommerce-Price-amount bdi, span.price ins .amount bdi");
        if (insPriceEl != null) return parseEuroPrice(insPriceEl.text());

        // Variable range: two price amounts separated by " – "
        Elements amounts = card.select("span.price .woocommerce-Price-amount bdi, span.price .amount bdi");
        if (!amounts.isEmpty()) {
            // Use first (lower) price for variable products
            return parseEuroPrice(amounts.first().text());
        }

        // Fallback: any price amount
        Element priceEl = card.selectFirst("span.price");
        if (priceEl != null) return parseEuroPrice(priceEl.text());

        return null;
    }

    private Double parseEuroPrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // Remove currency symbols and whitespace, normalize decimal comma
        String cleaned = raw.replaceAll("[^\\d,.]", "").replace(",", ".").trim();
        // Handle "12.345.67" (thousand sep dot, decimal dot) → keep last segment
        if (cleaned.matches(".*\\..*\\..*")) {
            cleaned = cleaned.replaceAll("\\.", "");
        }
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException e) {
            Matcher m = Pattern.compile("[\\d]+[.]?[\\d]*").matcher(cleaned);
            if (m.find()) try { return Double.parseDouble(m.group()); } catch (NumberFormatException ignored) {}
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

            safeSleep(2500 + ThreadLocalRandom.current().nextLong(2500));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p, boolean skipNutrition) {
        // Brand — WooCommerce taxonomy term
        Element brandEl = doc.selectFirst(".product_meta .posted_in a, .product_meta .sku_wrapper + * a, [rel=tag]");
        if (brandEl == null) brandEl = doc.selectFirst(".brand a, .woocommerce-product-attributes td a");
        if (brandEl != null) p.setBrand(brandEl.text().trim());

        // Package weight from product name
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) {
            Double weight = extractWeightFromName(p.getName());
            if (weight != null) p.setPrimaryWeightGrams(weight);
        }

        // Description — WooCommerce short + long description
        Element shortDesc = doc.selectFirst(".woocommerce-product-details__short-description, .product-short-description");
        Element longDesc = doc.selectFirst("#tab-description .woocommerce-Tabs-panel, .woocommerce-Tabs-panel--description");
        String desc = "";
        if (shortDesc != null) desc = shortDesc.text().trim();
        if (longDesc != null && !longDesc.text().isBlank()) desc = (desc + " " + longDesc.text().trim()).trim();
        if (!desc.isBlank()) p.setDescription(desc);

        if (!skipNutrition) {
            extractNutritionFromTable(doc, p);

            // Fallback: parse from description text
            if (p.getProteinPer100g() == null && !desc.isBlank()) {
                Double protein = nutritionParser.extractProteinPer100g(desc);
                if (protein != null) p.setProteinPer100g(protein);
            }

            baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
        }

    }

    private void extractNutritionFromTable(Document doc, Product p) {
        // WooCommerce product attributes table or custom nutrition table
        for (Element row : doc.select("table.shop_attributes tr, .woocommerce-product-attributes tr, table tr")) {
            String label = row.select("th, td:first-child").text().toLowerCase();
            String value = row.select("td:last-child, td:nth-child(2)").text();

            if (label.contains("proteini") || label.contains("protein") || label.contains("bjelančevine")) {
                Double v = parseNutritionValue(value);
                if (v != null && v > 0 && v <= 100) p.setProteinPer100g(v);
            } else if ((label.contains("šeće") || label.contains("šećer") || label.contains("sugars")) && !label.contains("ugljik")) {
                Double v = parseNutritionValue(value);
                if (v != null && v >= 0) p.setSugarPer100g(v);
            } else if (label.contains("masti") || label.contains("masnoće") || label.contains("fat")) {
                Double v = parseNutritionValue(value);
                if (v != null && v >= 0) p.setFatPer100g(v);
            } else if (label.contains("energij") || label.contains("kalorij") || label.contains("energy")) {
                // Prefer kcal value if line contains both kJ and kcal
                Double v = extractKcal(value);
                if (v != null && v > 0) p.setCaloriePer100g(v);
            }
        }
    }

    private Double extractKcal(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // If "kJ / kcal" format, extract kcal (second number)
        Matcher m = Pattern.compile("[\\d]+[,.]?[\\d]*").matcher(raw);
        Double first = null, second = null;
        if (m.find()) {
            try { first = Double.parseDouble(m.group().replace(",", ".")); } catch (NumberFormatException ignored) {}
        }
        if (m.find()) {
            try { second = Double.parseDouble(m.group().replace(",", ".")); } catch (NumberFormatException ignored) {}
        }
        // kcal values are typically 300–500; kJ values are ~4x larger
        if (second != null && second < 900) return second;
        if (first != null && first < 900) return first;
        return null;
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

    private static final Pattern WEIGHT_IN_NAME = Pattern.compile("(\\d+[.,]?\\d*)\\s*kg|([1-9]\\d{2,4})\\s*g", Pattern.CASE_INSENSITIVE);

    private Double extractWeightFromName(String name) {
        if (name == null) return null;
        Matcher m = WEIGHT_IN_NAME.matcher(name);
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
