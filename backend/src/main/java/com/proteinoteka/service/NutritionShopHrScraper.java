package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.BrandReputationRepository;
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
    private final BrandReputationRepository brandReputationRepository;

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
        // Package weight from name (set during listing parse, but verify/refine here)
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) {
            Double weight = extractWeightFromName(p.getName());
            if (weight != null) p.setPrimaryWeightGrams(weight);
        }

        // Brand extraction
        if (p.getBrand() == null || p.getBrand().isBlank()) {
            String brand = extractBrand(doc, p.getName());
            if (brand != null) p.setBrand(brand);
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
     * Parses the nutrition table on nutrition-shop.hr. Three layouts exist:
     *
     *   A) 3-col: label | per-serving | per-100g
     *      e.g. "Prosječne hranjive vrijednosti u preporučenoj dnevnoj dozi: | 30,4 g | 100 g"
     *
     *   B) 4-col: label | per-serving | %DRI | per-100g
     *      e.g. "Prosječne hranjive vrijednosti na | 35 g | PU* | 100 g"
     *      The scraper must find the column index of "100 g" in the header, NOT assume col 2.
     *
     *   C) 2-col: label | per-serving (no 100g column)
     *      e.g. "Nutritivne vrijednosti | 1 porcija (33 g)"
     *      Serving size is extracted from the header; values are scaled to per-100g.
     */
    private void extractNutritionFromTable(Document doc, Product p) {
        Element table = findNutritionTable(doc);
        if (table == null) {
            log.debug("[{}] No nutrition table found for '{}'", STORE_NAME, p.getName());
            return;
        }

        int valueColIndex = -1;     // index of column to read (0-based among <td>s)
        double scaleTo100g = 1.0;

        Element headerRow = table.selectFirst("tr");
        if (headerRow != null) {
            Elements headerCells = headerRow.select("td, th");
            // Find which header cell contains "100 g" — works for 3-col AND 4-col tables
            for (int i = 1; i < headerCells.size(); i++) {
                String cellText = headerCells.get(i).text().toLowerCase();
                if (cellText.contains("100g") || cellText.contains("100 g")) {
                    valueColIndex = i;
                    scaleTo100g = 1.0;
                    break;
                }
            }
            // No 100g column — serving-only table; extract serving size to scale
            if (valueColIndex < 0 && headerCells.size() >= 2) {
                String valueHeader = headerCells.get(1).text();
                Matcher sm = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*g").matcher(valueHeader);
                if (sm.find()) {
                    try {
                        double serving = Double.parseDouble(sm.group(1).replace(",", "."));
                        if (serving > 0) {
                            valueColIndex = 1;
                            scaleTo100g = 100.0 / serving;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        if (valueColIndex < 0) {
            log.debug("[{}] '{}' — cannot determine value column in nutrition table, skipping",
                    STORE_NAME, p.getName());
            return;
        }

        log.debug("[{}] '{}' — nutrition col={}, scale={}", STORE_NAME, p.getName(),
                valueColIndex, scaleTo100g == 1.0 ? "1.0 (100g col)" : String.format("%.2f (serving)", scaleTo100g));

        final int colIdx = valueColIndex;
        final double scale = scaleTo100g;
        for (Element row : table.select("tr")) {
            Elements tds = row.select("td");
            if (tds.size() < 2 || tds.size() <= colIdx) continue;

            String label = tds.get(0).text().toLowerCase().trim();
            String value = tds.get(colIdx).text().trim();

            applyNutritionField(label, value, scale, p);
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

    private void applyNutritionField(String label, String value, double scale, Product p) {
        if (label.isBlank() || value.isBlank()) return;

        if (label.contains("energet") || label.contains("kalorij")) {
            Double kcal = parseKcal(value);
            if (kcal != null && kcal > 0 && p.getCaloriePer100g() == null) {
                double scaled = round1(kcal * scale);
                if (scaled >= 200 && scaled <= 900) p.setCaloriePer100g(scaled);
            }

        } else if (label.contains("bjelančevine") || label.equals("proteini")
                || label.contains("protein")) {
            Double v = parseFirstNumber(value);
            if (v != null && v > 0 && p.getProteinPer100g() == null) {
                double scaled = round1(v * scale);
                if (scaled > 0 && scaled <= 100) p.setProteinPer100g(scaled);
            }

        } else if ((label.contains("šećer") || label.contains("secer") || label.contains("šeće"))
                && !label.contains("ugljik")) {
            Double v = parseFirstNumber(value);
            if (v != null && v >= 0 && p.getSugarPer100g() == null)
                p.setSugarPer100g(round1(v * scale));

        } else if (label.contains("mast") && !label.contains("zasić") && !label.contains("zasic")) {
            Double v = parseFirstNumber(value);
            if (v != null && v >= 0 && p.getFatPer100g() == null)
                p.setFatPer100g(round1(v * scale));
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

    // ── Brand extraction ──────────────────────────────────────────────────────

    /**
     * Tries two strategies to extract the brand:
     * 1. WooCommerce Perfect Brands plugin nav item: the current product's brand ancestor
     *    is marked with class "current-product-parent" on the li element.
     * 2. Name-based fallback: checks whether the product name starts with (or ends with,
     *    after " – ") a brand from the brand_reputation table.
     */
    private String extractBrand(Document doc, String productName) {
        // Strategy 1: pwb-brand nav taxonomy
        Element brandEl = doc.selectFirst(
                "li.menu-item-object-pwb-brand.current-product-parent a, " +
                "li.menu-item-object-pwb-brand.current-product-ancestor a[href*='/brand/']");
        if (brandEl != null) {
            String brand = brandEl.text().trim();
            if (!brand.isBlank()) {
                log.debug("[{}] Brand from nav: '{}'", STORE_NAME, brand);
                return brand;
            }
        }

        // Strategy 2: match product name against known brands (start or after " – ")
        if (productName == null) return null;
        String nameLower = productName.toLowerCase();
        List<String> knownBrands = brandReputationRepository.findAll().stream()
                .map(b -> b.getBrandName())
                .toList();
        // Check prefix match first (e.g. "NUTREND 100% WHEY...")
        for (String brand : knownBrands) {
            if (nameLower.startsWith(brand.toLowerCase() + " ")
                    || nameLower.startsWith(brand.toLowerCase() + ",")
                    || nameLower.startsWith(brand.toLowerCase() + "-")) {
                log.debug("[{}] Brand from name prefix: '{}'", STORE_NAME, brand);
                return brand;
            }
        }
        // Check suffix after " – " (e.g. "Animal Whey – Universal Nutrition")
        int dashIdx = productName.indexOf(" – ");
        if (dashIdx > 0) {
            String suffix = productName.substring(dashIdx + 3).trim()
                    .replaceAll(",?\\s*\\d+\\s*[gk][g]?\\s*$", "").trim();
            for (String brand : knownBrands) {
                if (suffix.equalsIgnoreCase(brand)) {
                    log.debug("[{}] Brand from name suffix: '{}'", STORE_NAME, brand);
                    return brand;
                }
            }
        }
        return null;
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
                return httpClient.connection(url, requiresProxy())
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
