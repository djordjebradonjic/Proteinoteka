package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.ProductNameCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class MyProteinScraper implements StoreScraper {

    private static final String STORE_NAME = "MyProtein";
    private static final String SITE_ORIGIN = "https://www.myprotein.rs";
    private static final String BASE_URL = SITE_ORIGIN + "/c/nutrition/protein/";
    private static final int MAX_DETAIL_FETCH_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;
    private static final double MIN_PACKAGE_GRAMS = 500;
    private static final String MASTER_DATA_MARKER = "const masterData = ";

    // Matches flavour titles tagging a sibling product format (e.g. "Chocolate (Milkshake)",
    // "Vanilla (+Collagen)", "Cocoa (naturally derived sweeteners)", "Unflavoured (Grass-Fed)")
    // that MyProtein lists as extra SKUs under the same master product.
    private static final Pattern SIBLING_FORMAT_PATTERN = Pattern.compile(
            "\\((?:\\+?Collagen|Milkshake|Grass[- ]?Fed[^)]*|[^)]*naturally derived sweeteners)\\)",
            Pattern.CASE_INSENSITIVE);

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getStoreName() { return STORE_NAME; }

    @Override
    public String getBaseUrl() { return BASE_URL; }

    // myprotein.rs (Astro SSR) renders listing and detail pages as plain HTML —
    // confirmed via direct fetch, no Cloudflare/JS challenge. Plain JSoup avoids the
    // Playwright/Chromium + proxy bandwidth cost entirely.
    @Override
    public boolean usePlaywrightForListing() { return false; }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?pageNumber=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("a[data-e2e=pagination-next]") != null;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        Elements elements = doc.select("product-card-wrapper[data-sku]");
        log.info("[{}] Found {} products on listing page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) stubs.add(p);
        }

        return enrichWithDetails(stubs, skipUrls);
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element card) {
        try {
            Element titleEl = card.selectFirst(".product-item-title");
            if (titleEl == null) return null;
            String name = titleEl.text().trim();
            if (name.isBlank()) return null;

            Element anchor = card.selectFirst("a[data-name=image-anchor]");
            if (anchor == null) return null;
            String href = anchor.attr("href");
            if (href.isBlank()) return null;

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(href.startsWith("http") ? href : SITE_ORIGIN + href);

            String imageUrl = anchor.attr("data-primary-src");
            if (!imageUrl.isBlank()) p.setImageUrl(imageUrl);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    // -------------------- Detail page enrichment + variant expansion --------------------

    private List<Product> enrichWithDetails(List<Product> stubs, Set<String> skipUrls) {
        List<Product> result = new ArrayList<>();
        int consecutiveFailures = 0;

        for (Product stub : stubs) {
            if (stub.getUrl() == null || stub.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(stub.getName())) {
                log.info("[{}] Skipping '{}' - not a protein product", STORE_NAME, stub.getName());
                continue;
            }

            Document doc = fetchDetailPage(stub.getUrl());
            if (doc == null) {
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    log.error("[{}] {} consecutive detail page failures — stopping enrichment",
                            STORE_NAME, consecutiveFailures);
                    return result;
                }
                continue;
            }
            consecutiveFailures = 0;

            // MyProtein sometimes 301-redirects a discontinued SKU's detail page to a
            // different, still-active product (e.g. "Organski Whey Protein" -> "Impact
            // Whey Protein"). If we keep building variant URLs from the original listing
            // URL, we'd create permanent duplicate rows for the discontinued SKU. Rebase
            // onto the redirected URL so variants match the canonical product and the
            // old SKU's rows become stale and get cleaned up.
            String finalUrl = doc.location();
            if (finalUrl != null && !finalUrl.isBlank() && !finalUrl.equals(stub.getUrl())) {
                log.info("[{}] '{}' redirected: {} -> {}", STORE_NAME, stub.getName(), stub.getUrl(), finalUrl);
                stub.setUrl(finalUrl);
            }

            try {
                JsonNode masterData = extractMasterData(doc);
                if (masterData == null) {
                    log.warn("[{}] No masterData found for '{}', skipping", STORE_NAME, stub.getName());
                    safeSleep(3000 + ThreadLocalRandom.current().nextLong(3000));
                    continue;
                }

                List<Product> variants = expandByVariants(masterData, stub);
                if (variants.isEmpty()) {
                    log.debug("[{}] '{}' -> no eligible package sizes (>=500g, in stock)", STORE_NAME, stub.getName());
                    safeSleep(3000 + ThreadLocalRandom.current().nextLong(3000));
                    continue;
                }

                Product first = variants.get(0);
                first.setBrand(extractBrand(masterData));
                Document descDoc = buildDescriptionDoc(masterData);
                first.setDescription(descDoc.text().trim());

                boolean anyNeedsNutrition = variants.stream()
                        .anyMatch(v -> !skipUrls.contains(v.getUrl()));
                if (anyNeedsNutrition) {
                    extractNutritionFromTable(masterData, first);
                    if (first.getProteinPer100g() == null && !first.getDescription().isBlank()) {
                        Double protein = nutritionParser.extractProteinPer100g(first.getDescription());
                        if (protein != null) first.setProteinPer100g(protein);
                    }
                    baseEnricher.enrichWithAiIfNeeded(descDoc, first, STORE_NAME);
                }

                for (int i = 1; i < variants.size(); i++) {
                    Product v = variants.get(i);
                    v.setBrand(first.getBrand());
                    v.setDescription(first.getDescription());
                    copyNutritionFields(first, v);
                }

                for (Product v : variants) {
                    log.info("[{}] '{}' ({}) -> price={}, protein={}",
                            STORE_NAME, v.getName(), v.getPackage_weight(), v.getPrice(), v.getProteinPer100g());
                }
                result.addAll(variants);

            } catch (Exception e) {
                log.error("[{}] Failed to process '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(3000 + ThreadLocalRandom.current().nextLong(3000));
        }

        return result;
    }

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_DETAIL_FETCH_RETRIES; attempt++) {
            try {
                return httpClient.connection(url, requiresProxy()).get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}",
                        STORE_NAME, attempt, MAX_DETAIL_FETCH_RETRIES, url, e.getMessage());
                safeSleep(2000L * attempt);
            }
        }
        log.error("[{}] Failed to fetch {} after {} attempts, skipping",
                STORE_NAME, url, MAX_DETAIL_FETCH_RETRIES);
        return null;
    }

    // -------------------- masterData extraction --------------------

    /**
     * Finds the inline {@code <script>} that assigns {@code const masterData = {...}}
     * and parses the object literal as JSON. The literal is valid JSON (string keys/values
     * only use double quotes), so a simple brace-depth scan from the opening {@code {}
     * to its matching closer yields a parseable JSON document.
     */
    JsonNode extractMasterData(Document doc) {
        for (Element script : doc.select("script")) {
            String data = script.data();
            int markerIdx = data.indexOf(MASTER_DATA_MARKER);
            if (markerIdx == -1) continue;

            int start = markerIdx + MASTER_DATA_MARKER.length();
            int end = findMatchingBrace(data, start);
            if (end == -1) continue;

            try {
                return objectMapper.readTree(data.substring(start, end + 1));
            } catch (Exception e) {
                log.warn("[{}] Failed to parse masterData JSON: {}", STORE_NAME, e.getMessage());
                return null;
            }
        }
        return null;
    }

    /**
     * Returns the index of the {@code }} matching the {@code {} at {@code start},
     * skipping over braces that appear inside JSON string literals.
     */
    private static int findMatchingBrace(String s, int start) {
        if (start >= s.length() || s.charAt(start) != '{') return -1;

        int depth = 0;
        boolean inString = false;
        boolean escape = false;

        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inString) {
                if (escape) escape = false;
                else if (c == '\\') escape = true;
                else if (c == '"') inString = false;
                continue;
            }
            if (c == '"') inString = true;
            else if (c == '{') depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    // -------------------- Variant expansion --------------------

    /**
     * Splits a MyProtein product into one {@link Product} per package size (the
     * {@code Amount} option, e.g. "900G - 30servings" or "2.5kg"). Packages under
     * 500g and groups that are entirely out of stock are skipped. Each variant gets a
     * stable {@code ?pakovanje=<weight>} URL suffix so price history is preserved
     * across scrapes.
     */
    List<Product> expandByVariants(JsonNode masterData, Product stub) {
        List<Product> variants = new ArrayList<>();
        String cleanName = ProductNameCleaner.clean(masterData.path("pageTitle").asText(stub.getName()));

        // MyProtein assigns each flavour SKU its own slightly different "Amount" title
        // for what is physically the same package tier (e.g. 870g/900g/930g/1000g all
        // sell for the same price). Grouping by exact grams therefore produces dozens
        // of near-duplicate listings with identical prices. Grouping by price instead
        // collapses those into the real, distinct package tiers; the smallest reported
        // weight within a price group is used as a conservative weight label.
        Map<Long, List<JsonNode>> groupsByPrice = new LinkedHashMap<>();
        Map<JsonNode, Double> gramsByVariant = new IdentityHashMap<>();

        for (JsonNode v : masterData.path("variants")) {
            if (!v.path("inStock").asBoolean(false)) continue;

            String amountTitle = null;
            String flavourTitle = null;
            for (JsonNode c : v.path("choices")) {
                String optionKey = c.path("optionKey").asText();
                if ("Amount".equals(optionKey)) {
                    amountTitle = c.path("title").asText();
                } else if ("Flavour".equals(optionKey)) {
                    flavourTitle = c.path("title").asText();
                }
            }
            if (amountTitle == null) continue;

            // MyProtein bundles sibling product formats (Milkshake, +Collagen, Grass-Fed,
            // naturally-sweetened) as extra flavour SKUs on the same master product page.
            // Their nutrition differs from the page's main product, so including them
            // would both pollute the flavour list and skew price/weight grouping.
            if (flavourTitle != null && SIBLING_FORMAT_PATTERN.matcher(flavourTitle).find()) {
                log.debug("[{}] '{}' -> skipping sibling-format flavour '{}'", STORE_NAME, cleanName, flavourTitle);
                continue;
            }

            double grams = parseAmountToGrams(amountTitle);
            if (grams < MIN_PACKAGE_GRAMS) {
                log.debug("[{}] '{}' -> skipping {} (< 500g)", STORE_NAME, cleanName, amountTitle);
                continue;
            }

            double price = v.path("price").path("price").path("amount").asDouble(0);
            if (price <= 0) continue;

            long priceKey = Math.round(price);
            groupsByPrice.computeIfAbsent(priceKey, k -> new ArrayList<>()).add(v);
            gramsByVariant.put(v, grams);
        }

        // Two or more price groups can share the same weight label (e.g. several
        // flavours of the "2.5kg" tier on individual sale prices, each forming its
        // own price group). Since the weight label determines the variant's URL,
        // such collisions would otherwise produce multiple Products with the same
        // URL in a single scrape, each overwriting the previous one's price and
        // spamming price history. Merge those into one variant, keeping the lowest
        // price ("starting from") and the union of flavours.
        Map<String, Product> variantsByWeightLabel = new LinkedHashMap<>();

        for (Map.Entry<Long, List<JsonNode>> entry : groupsByPrice.entrySet()) {
            long priceKey = entry.getKey();
            List<JsonNode> members = entry.getValue();

            double minGrams = members.stream()
                    .mapToDouble(gramsByVariant::get)
                    .min().orElse(0);
            if (minGrams <= 0) continue;
            String weightLabel = formatWeightLabel(minGrams);

            String imageUrl = null;
            for (JsonNode v : members) {
                if (imageUrl == null) {
                    JsonNode images = v.path("product").path("images");
                    if (images.isArray() && !images.isEmpty()) {
                        String img = images.get(0).path("original").asText(null);
                        if (img != null && !img.isBlank()) imageUrl = img;
                    }
                }
            }

            List<String> flavours = new ArrayList<>();
            for (JsonNode v : members) {
                for (JsonNode c : v.path("choices")) {
                    if ("Flavour".equals(c.path("optionKey").asText())) {
                        String flavour = c.path("title").asText().trim();
                        if (!flavour.isBlank() && !flavours.contains(flavour))
                            flavours.add(flavour);
                    }
                }
            }

            Product existing = variantsByWeightLabel.get(weightLabel);
            if (existing == null || priceKey < Long.parseLong(existing.getPrice())) {
                Product variant = new Product();
                variant.setName(cleanName);
                variant.setUrl(stub.getUrl() + (stub.getUrl().contains("?") ? "&" : "?") + "pakovanje=" + weightLabel);
                variant.setPrice(formatPrice(priceKey));
                variant.setImageUrl(imageUrl != null ? imageUrl : stub.getImageUrl());
                variant.getPackage_weight().add(weightLabel);
                variant.setPrimaryWeightGrams(minGrams);
                variant.getFlavours().addAll(flavours);
                if (existing != null) {
                    for (String f : existing.getFlavours())
                        if (!variant.getFlavours().contains(f)) variant.getFlavours().add(f);
                }
                variantsByWeightLabel.put(weightLabel, variant);
            } else {
                for (String f : flavours)
                    if (!existing.getFlavours().contains(f)) existing.getFlavours().add(f);
            }
        }

        variants.addAll(variantsByWeightLabel.values());
        return variants;
    }

    private static void copyNutritionFields(Product from, Product to) {
        if (to.getProteinPer100g() == null) to.setProteinPer100g(from.getProteinPer100g());
        if (to.getFatPer100g() == null) to.setFatPer100g(from.getFatPer100g());
        if (to.getSugarPer100g() == null) to.setSugarPer100g(from.getSugarPer100g());
        if (to.getCaloriePer100g() == null) to.setCaloriePer100g(from.getCaloriePer100g());
        if (to.getProteinSource() == null) to.setProteinSource(from.getProteinSource());
    }

    /**
     * Parses an "Amount" choice title (e.g. "900G - 30servings", "2.5kg", "345G -15servings")
     * into grams. Only the leading number + unit is used; the trailing serving count is ignored.
     */
    private static double parseAmountToGrams(String title) {
        if (title == null) return 0;
        Matcher m = Pattern.compile("^(\\d+[.,]?\\d*)\\s*(kg|g)\\b", Pattern.CASE_INSENSITIVE).matcher(title.trim());
        if (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1).replace(",", "."));
                return m.group(2).equalsIgnoreCase("kg") ? val * 1000 : val;
            } catch (Exception ignored) {}
        }
        return 0;
    }

    private static String formatWeightLabel(double grams) {
        if (grams % 1000 == 0) return ((int) (grams / 1000)) + "kg";
        return ((int) grams) + "g";
    }

    private static String formatPrice(double price) {
        return String.valueOf(Math.round(price));
    }

    // -------------------- Brand & description extraction --------------------

    private String extractBrand(JsonNode masterData) {
        String brand = masterData.path("brand").asText(null);
        return (brand != null && !brand.isBlank()) ? brand.trim() : null;
    }

    /**
     * Builds a description document from the default variant's rich-content fields
     * ({@code legalName}, {@code ingredients}, {@code suggestedUse}) — used both for
     * sugar/sweetener heuristics in {@code calculateValueScore} and as AI enrichment context.
     */
    private Document buildDescriptionDoc(JsonNode masterData) {
        StringBuilder html = new StringBuilder();
        for (JsonNode c : masterData.path("defaultVariant").path("content")) {
            String key = c.path("key").asText();
            if (!key.equals("legalName") && !key.equals("ingredients") && !key.equals("suggestedUse")) continue;

            for (JsonNode part : c.path("value").path("richContentValue").path("content")) {
                String fragment = part.path("content").asText("");
                if (!fragment.isBlank()) html.append(fragment).append("\n");
            }
        }
        return Jsoup.parse(html.toString());
    }

    // -------------------- Nutrition extraction --------------------

    /**
     * Parses the {@code nutritionalInfo} table from the default variant's content.
     * The table's header row (containing a "100 g" / "100g" column) is located
     * dynamically since, unlike GymBeam, it is not the table's first row — earlier
     * rows hold a title caption.
     */
    void extractNutritionFromTable(JsonNode masterData, Product p) {
        try {
            String html = null;
            for (JsonNode c : masterData.path("defaultVariant").path("content")) {
                if (!"nutritionalInfo".equals(c.path("key").asText())) continue;
                for (JsonNode part : c.path("value").path("richContentValue").path("content")) {
                    String fragment = part.path("content").asText(null);
                    if (fragment != null) { html = fragment; break; }
                }
                break;
            }
            if (html == null) return;

            Document doc = Jsoup.parse(html);
            for (Element table : doc.select("table")) {
                Elements rows = table.select("tr");

                int per100gCol = -1;
                int headerRowIdx = -1;

                for (int r = 0; r < rows.size() && per100gCol < 0; r++) {
                    Elements cells = rows.get(r).select("td, th");
                    for (int i = 0; i < cells.size(); i++) {
                        String cellText = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                        if (cellText.contains("100g") || cellText.contains("100gr")) {
                            per100gCol = i;
                            headerRowIdx = r;
                            break;
                        }
                    }
                }
                if (per100gCol < 1) continue;

                for (int r = headerRowIdx + 1; r < rows.size(); r++) {
                    Elements cells = rows.get(r).select("td, th");
                    if (cells.size() <= per100gCol) continue;

                    // Sub-rows (e.g. "od kojih šećeri") have an extra leading empty
                    // cell, which shifts the label and value columns one to the right.
                    String cell0 = cells.get(0).text().replace(" ", " ").trim();
                    int colOffset = 0;
                    String label;
                    if (cell0.isEmpty() && cells.size() > 1) {
                        label = cells.get(1).text().trim().toLowerCase();
                        colOffset = 1;
                    } else {
                        label = cell0.toLowerCase();
                    }

                    int valueCol = per100gCol + colOffset;
                    if (cells.size() <= valueCol) continue;

                    if (label.contains("energ")) {
                        String rawCell = cells.get(valueCol).text();
                        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(rawCell);
                        if (m.find()) {
                            try {
                                p.setCaloriePer100g(round1(Double.parseDouble(m.group(1).replace(",", "."))));
                            } catch (Exception ignored) {}
                        }
                        continue;
                    }

                    String rawValue = cells.get(valueCol).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();
                    if (rawValue.isBlank()) continue;

                    double value;
                    try { value = Double.parseDouble(rawValue); }
                    catch (Exception e) { continue; }
                    if (value < 0 || value > 10000) continue;

                    if (label.equals("proteini") || label.equals("protein")) {
                        if (value > 0 && value <= 95) p.setProteinPer100g(round1(value));
                    } else if ((label.equals("masti") || label.equals("fat"))
                            && !label.contains("zasić") && !label.contains("saturat")) {
                        if (value <= 100) p.setFatPer100g(round1(value));
                    } else if (label.contains("šećeri") || label.contains("seceri") || label.contains("sugars")) {
                        if (value <= 100) p.setSugarPer100g(round1(value));
                    }
                }

                if (p.getProteinPer100g() != null) break;
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to extract nutrition from table: {}", STORE_NAME, e.getMessage());
        }
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
