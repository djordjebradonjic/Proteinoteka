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
 *
 * Proxy credit strategy:
 *   - Listing pages: plain JSoup (no Playwright, no proxy).
 *   - Detail pages: skipped entirely for products already in DB with complete nutrition
 *     (skipUrls set built in ScraperService). Only newly seen products or those with
 *     incomplete nutrition trigger a detail fetch.
 *
 * Nutrition table format on this site is 3-column:
 *   col1=label | col2=per-serving | col3=per-100g
 * We always use col3 (td:last-child / td:nth-child(3)) for 100g values.
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

    private static final Pattern WEIGHT_IN_NAME =
            Pattern.compile("(\\d+[.,]?\\d*)\\s*kg|([1-9]\\d{2,4})\\s*g", Pattern.CASE_INSENSITIVE);
    // Extracts kcal from "113 kcal/ 474 kJ" or "372 kcal"
    private static final Pattern KCAL_PATTERN =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*kcal", Pattern.CASE_INSENSITIVE);
    // Generic first number extractor for nutrition values like "78,5", "3,8 g"
    private static final Pattern NUTRITION_NUM =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)");

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;

    @Override public String getStoreName()              { return STORE_NAME; }
    @Override public String getBaseUrl()                { return BASE_URL; }
    @Override public String getMarket()                 { return "hr"; }
    @Override public String getCurrency()               { return "EUR"; }
    @Override public boolean usePlaywrightForListing()  { return false; }

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

        Elements cards = doc.select("ul.products li.product");
        log.info("[{}] Found {} product cards on listing page", STORE_NAME, cards.size());

        for (Element card : cards) {
            Product p = parseCard(card);
            if (p != null) stubs.add(p);
        }

        log.info("[{}] {} stubs parsed, {} already have complete nutrition (no detail fetch)",
                STORE_NAME, stubs.size(),
                stubs.stream().filter(s -> skipUrls.contains(s.getUrl())).count());

        return enrichWithDetails(stubs, skipUrls);
    }

    // ── Listing parsing ───────────────────────────────────────────────────────

    private Product parseCard(Element card) {
        try {
            Element anchor = card.selectFirst("a.woocommerce-LoopProduct-link");
            if (anchor == null) return null;
            String url = anchor.attr("href");
            if (url.isBlank()) return null;

            Element nameEl = card.selectFirst("h2.woocommerce-loop-product__title");
            if (nameEl == null) return null;
            String name = nameEl.text().trim();
            if (name.isBlank()) return null;

            Double price = extractListingPrice(card);

            // Best image from srcset (largest candidate)
            String imageUrl = null;
            Element img = card.selectFirst("img.attachment-woocommerce_thumbnail, img.wp-post-image");
            if (img != null) {
                imageUrl = img.attr("src");
                String srcset = img.attr("srcset");
                if (!srcset.isBlank()) {
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

            // Try to extract package weight directly from the product name in the listing
            Double weight = extractWeightFromName(name);
            if (weight != null) p.setPrimaryWeightGrams(weight);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing card: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private Double extractListingPrice(Element card) {
        // On-sale: current price is inside <ins>
        Element insPrice = card.selectFirst("span.price ins .woocommerce-Price-amount bdi,"
                + " span.price ins .amount bdi");
        if (insPrice != null) return parseEuroPrice(insPrice.text());

        // Regular or variable — take the first (lowest) price amount
        Element firstAmount = card.selectFirst(
                "span.price .woocommerce-Price-amount bdi, span.price .amount bdi");
        if (firstAmount != null) return parseEuroPrice(firstAmount.text());

        Element priceSpan = card.selectFirst("span.price");
        if (priceSpan != null) return parseEuroPrice(priceSpan.text());

        return null;
    }

    /** Parses "175,00 €" or "175,00" into 175.0. */
    private Double parseEuroPrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String cleaned = raw.replaceAll("[^\\d,.]", "").replace(",", ".").trim();
        // Handle thousand-separator dots ("1.234.56") — remove all but last dot segment
        if (cleaned.matches(".*\\..*\\..*")) {
            int lastDot = cleaned.lastIndexOf('.');
            cleaned = cleaned.substring(0, lastDot).replace(".", "") + "." + cleaned.substring(lastDot + 1);
        }
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException e) {
            Matcher m = NUTRITION_NUM.matcher(cleaned);
            if (m.find()) {
                try { return Double.parseDouble(m.group(1)); } catch (NumberFormatException ignored) {}
            }
            return null;
        }
    }

    // ── Detail page enrichment ────────────────────────────────────────────────

    private List<Product> enrichWithDetails(List<Product> stubs, Set<String> skipUrls) {
        List<Product> result = new ArrayList<>();
        int consecutiveFailures = 0;

        for (Product stub : stubs) {
            if (stub.getUrl() == null || stub.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(stub.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, stub.getName());
                continue;
            }

            // Nutrition already complete — add to result without any HTTP request
            if (skipUrls.contains(stub.getUrl())) {
                log.debug("[{}] '{}' — nutrition complete, skipping detail fetch", STORE_NAME, stub.getName());
                result.add(stub);
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
                enrichProduct(doc, stub);
                result.add(stub);
                log.info("[{}] Enriched '{}' protein={}g/100g", STORE_NAME, stub.getName(), stub.getProteinPer100g());
            } catch (Exception e) {
                log.error("[{}] Error enriching '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(2500 + ThreadLocalRandom.current().nextLong(2500));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p) {
        // Brand: WooCommerce Perfect Brands plugin marks the active brand in the nav
        // as li.pwb-brand.current_page_parent; its anchor text is the brand name.
        Element brandEl = doc.selectFirst("li.pwb-brand.current_page_parent a");
        if (brandEl != null && !brandEl.text().isBlank()) {
            p.setBrand(brandEl.text().trim());
        }

        // Package weight from name (set during listing parse, but verify/refine here)
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) {
            Double weight = extractWeightFromName(p.getName());
            if (weight != null) p.setPrimaryWeightGrams(weight);
        }

        // Descriptions
        Element shortDesc = doc.selectFirst(".woocommerce-product-details__short-description");
        Element longDesc = doc.selectFirst("#tab-description .woocommerce-Tabs-panel,"
                + " .woocommerce-Tabs-panel--description");
        String desc = "";
        if (shortDesc != null) desc = shortDesc.text().trim();
        if (longDesc != null && !longDesc.text().isBlank())
            desc = (desc + " " + longDesc.text().trim()).trim();
        if (!desc.isBlank()) p.setDescription(desc);

        extractNutritionFromTable(doc, p);

        // Text fallback for protein
        if (p.getProteinPer100g() == null && !desc.isBlank()) {
            Double protein = nutritionParser.extractProteinPer100g(desc);
            if (protein != null) p.setProteinPer100g(protein);
        }

        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
    }

    /**
     * Parses the 3-column nutrition table used on nutrition-shop.hr:
     *   col1 = label | col2 = per-serving | col3 = per-100g  ← we always want col3
     *
     * Header row contains "100 g" in the third column, confirming the layout.
     * Falls back to any table with protein + energy keywords if the standard one is absent.
     */
    private void extractNutritionFromTable(Document doc, Product p) {
        Element table = findNutritionTable(doc);
        if (table == null) {
            log.debug("[{}] No nutrition table found for '{}'", STORE_NAME, p.getName());
            return;
        }

        // Detect column count from the header row to decide which td to read
        boolean has100gColumn = false;
        Element headerRow = table.selectFirst("tr");
        if (headerRow != null) {
            String headerText = headerRow.text().toLowerCase();
            has100gColumn = headerText.contains("100g") || headerText.contains("100 g");
        }

        for (Element row : table.select("tr")) {
            Elements tds = row.select("td");
            if (tds.size() < 2) continue;

            String label = tds.get(0).text().toLowerCase().trim();
            // Use col3 (100g) when present; otherwise col2 (per-serving)
            String value = has100gColumn && tds.size() >= 3
                    ? tds.get(2).text().trim()
                    : tds.get(1).text().trim();

            applyNutritionField(label, value, p);
        }
    }

    private Element findNutritionTable(Document doc) {
        // Primary: table whose header row explicitly contains "100 g"
        for (Element table : doc.select("table")) {
            Element firstRow = table.selectFirst("tr");
            if (firstRow != null) {
                String header = firstRow.text().toLowerCase();
                if ((header.contains("100g") || header.contains("100 g"))
                        && (header.contains("mjerica") || header.contains("porcija")
                            || header.contains("doza") || header.contains("serving"))) {
                    return table;
                }
            }
        }
        // Fallback: any table containing both a protein keyword and an energy keyword
        for (Element table : doc.select("table")) {
            String text = table.text().toLowerCase();
            boolean hasProtein = text.contains("bjelančevine") || text.contains("proteini")
                    || text.contains("protein");
            boolean hasEnergy = text.contains("kcal") || text.contains("kj");
            if (hasProtein && hasEnergy) return table;
        }
        return null;
    }

    private void applyNutritionField(String label, String value, Product p) {
        if (label.isBlank() || value.isBlank()) return;

        if (label.contains("energet") || label.contains("kalorij")) {
            // "113 kcal/ 474 kJ" or "372 kcal" — extract kcal
            Double kcal = parseKcal(value);
            if (kcal != null && kcal > 0 && p.getCaloriePer100g() == null)
                p.setCaloriePer100g(round1(kcal));

        } else if (label.contains("bjelančevine") || label.equals("proteini")
                || label.contains("protein")) {
            Double v = parseFirstNumber(value);
            if (v != null && v > 0 && v <= 100 && p.getProteinPer100g() == null)
                p.setProteinPer100g(round1(v));

        } else if ((label.contains("šećer") || label.contains("secer") || label.contains("šeće"))
                && !label.contains("ugljik")) {
            Double v = parseFirstNumber(value);
            if (v != null && v >= 0 && p.getSugarPer100g() == null)
                p.setSugarPer100g(round1(v));

        } else if (label.contains("mast") && !label.contains("zasić") && !label.contains("zasic")) {
            Double v = parseFirstNumber(value);
            if (v != null && v >= 0 && p.getFatPer100g() == null)
                p.setFatPer100g(round1(v));
        }
    }

    private Double parseKcal(String raw) {
        if (raw == null) return null;
        Matcher m = KCAL_PATTERN.matcher(raw);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (NumberFormatException ignored) {}
        }
        // Fallback: if no "kcal" label but value looks like a calorie (no kJ marker)
        return parseFirstNumber(raw);
    }

    private Double parseFirstNumber(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher m = NUTRITION_NUM.matcher(raw);
        if (!m.find()) return null;
        try { return Double.parseDouble(m.group(1).replace(",", ".")); }
        catch (NumberFormatException e) { return null; }
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    // ── Weight extraction ─────────────────────────────────────────────────────

    private Double extractWeightFromName(String name) {
        if (name == null) return null;
        Matcher m = WEIGHT_IN_NAME.matcher(name);
        while (m.find()) {
            try {
                if (m.group(1) != null)
                    return Double.parseDouble(m.group(1).replace(",", ".")) * 1000;
                if (m.group(2) != null) {
                    double g = Double.parseDouble(m.group(2));
                    if (g >= 100) return g;
                }
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    // ── HTTP ──────────────────────────────────────────────────────────────────

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_DETAIL_FETCH_RETRIES; attempt++) {
            try {
                return httpClient.connection(url)
                        .header("Accept-Language", "hr-HR,hr;q=0.9,en;q=0.8")
                        .get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}",
                        STORE_NAME, attempt, MAX_DETAIL_FETCH_RETRIES, url, e.getMessage());
                safeSleep(3000L * attempt);
            }
        }
        return null;
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
