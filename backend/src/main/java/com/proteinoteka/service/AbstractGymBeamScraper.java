package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.ProductNameCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
public abstract class AbstractGymBeamScraper implements StoreScraper {

    static final int MAX_DETAIL_FETCH_RETRIES = 3;
    static final int MAX_CONSECUTIVE_FAILURES = 5;
    static final double MIN_PACKAGE_GRAMS = 500;

    protected final NutritionParserService nutritionParser;
    protected final BaseScraperEnricher baseEnricher;
    protected final ProxyAwareHttpClient httpClient;
    final ObjectMapper objectMapper = new ObjectMapper();

    // Subclass provides: store identity and price formatting
    @Override public abstract String getStoreName();
    @Override public abstract String getBaseUrl();

    // RS rounds to integer (RSD), HR keeps 2 decimals (EUR)
    protected abstract String formatPrice(double price);

    @Override
    public boolean usePlaywrightForListing() { return false; }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? getBaseUrl() : getBaseUrl() + "?p=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("link[rel=next]") != null;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();
        Elements elements = doc.select("div[data-test=cp-products] > a[id^=product_item_]");
        log.info("[{}] Found {} products on listing page", getStoreName(), elements.size());
        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) stubs.add(p);
        }
        return enrichWithDetails(stubs, skipUrls);
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element a) {
        try {
            String name = a.attr("title").trim();
            if (name.isBlank()) {
                name = a.attr("aria-label").replaceFirst("(?i)^link to\\s*", "").trim();
            }
            if (name.isBlank()) return null;

            String href = a.attr("href");
            if (href.isBlank()) return null;

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(href);

            Element img = a.selectFirst("img");
            if (img != null) {
                String src = img.attr("src");
                if (!src.isBlank()) p.setImageUrl(src);
            }
            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", getStoreName(), e.getMessage());
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
                log.info("[{}] Skipping '{}' - not a protein product", getStoreName(), stub.getName());
                continue;
            }

            Document doc = fetchDetailPage(stub.getUrl());
            if (doc == null) {
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    log.error("[{}] {} consecutive detail page failures — stopping enrichment",
                            getStoreName(), consecutiveFailures);
                    return result;
                }
                continue;
            }
            consecutiveFailures = 0;

            try {
                JsonNode props = extractProps(doc);
                if (props == null) {
                    log.warn("[{}] No product data found for '{}', skipping", getStoreName(), stub.getName());
                    safeSleep(3000 + ThreadLocalRandom.current().nextLong(3000));
                    continue;
                }

                JsonNode productData = unwrapDevalue(props.path("productData"));
                JsonNode dataTabs = unwrapDevalue(props.path("productDataTabs"));
                String descriptionHtml = dataTabs.path("description").path("html").asText("");
                Document descDoc = Jsoup.parse(descriptionHtml);

                List<Product> variants = expandByPackageWeight(productData, stub);
                if (variants.isEmpty()) {
                    log.debug("[{}] '{}' -> no eligible package sizes (>=500g, in stock)", getStoreName(), stub.getName());
                    safeSleep(3000 + ThreadLocalRandom.current().nextLong(3000));
                    continue;
                }

                Product first = variants.get(0);
                first.setBrand(extractBrand(productData));
                first.setDescription(descDoc.text().trim());

                boolean anyNeedsNutrition = variants.stream()
                        .anyMatch(v -> !skipUrls.contains(v.getUrl()));
                if (anyNeedsNutrition) {
                    extractNutritionFromTable(descDoc, first);
                    if (first.getProteinPer100g() == null && !first.getDescription().isBlank()) {
                        Double protein = nutritionParser.extractProteinPer100g(first.getDescription());
                        if (protein != null) first.setProteinPer100g(protein);
                    }
                    baseEnricher.enrichWithAiIfNeeded(descDoc, first, getStoreName());
                }

                for (int i = 1; i < variants.size(); i++) {
                    Product v = variants.get(i);
                    v.setBrand(first.getBrand());
                    v.setDescription(first.getDescription());
                    copyNutritionFields(first, v);
                }

                for (Product v : variants) {
                    log.info("[{}] '{}' ({}) -> price={}, protein={}",
                            getStoreName(), v.getName(), v.getPackage_weight(), v.getPrice(), v.getProteinPer100g());
                }
                result.addAll(variants);

            } catch (Exception e) {
                log.error("[{}] Failed to process '{}': {}", getStoreName(), stub.getName(), e.getMessage());
            }

            safeSleep(3000 + ThreadLocalRandom.current().nextLong(3000));
        }

        return result;
    }

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_DETAIL_FETCH_RETRIES; attempt++) {
            try {
                return httpClient.connection(url).get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}",
                        getStoreName(), attempt, MAX_DETAIL_FETCH_RETRIES, url, e.getMessage());
                safeSleep(2000L * attempt);
            }
        }
        log.error("[{}] Failed to fetch {} after {} attempts, skipping",
                getStoreName(), url, MAX_DETAIL_FETCH_RETRIES);
        return null;
    }

    // -------------------- Astro "devalue" props extraction --------------------

    JsonNode extractProps(Document doc) {
        Element island = null;
        for (Element el : doc.select("astro-island")) {
            if ("ProductPageClient".equals(el.attr("component-export"))) {
                island = el;
                break;
            }
        }
        if (island == null) return null;

        String raw = island.attr("props");
        if (raw.isBlank()) return null;

        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            log.warn("[{}] Failed to parse props JSON: {}", getStoreName(), e.getMessage());
            return null;
        }
    }

    JsonNode unwrapDevalue(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return node;
        if (node.isArray() && node.size() == 2 && node.get(0).isInt()) {
            JsonNode val = node.get(1);
            if (val.isObject()) {
                ObjectNode out = objectMapper.createObjectNode();
                val.fields().forEachRemaining(e -> out.set(e.getKey(), unwrapDevalue(e.getValue())));
                return out;
            }
            if (val.isArray()) {
                ArrayNode out = objectMapper.createArrayNode();
                val.forEach(x -> out.add(unwrapDevalue(x)));
                return out;
            }
            return val;
        }
        return node;
    }

    // -------------------- Variant expansion --------------------

    List<Product> expandByPackageWeight(JsonNode productData, Product stub) {
        List<Product> variants = new ArrayList<>();
        String cleanName = ProductNameCleaner.clean(productData.path("name").asText(stub.getName()));

        boolean hasMassOption = false;
        for (JsonNode opt : productData.path("configurable_options")) {
            if ("mass_grams_g".equals(opt.path("attribute_code").asText())) {
                hasMassOption = true;
                break;
            }
        }

        JsonNode configVariants = productData.path("configurable_variants");

        if (hasMassOption && configVariants.isArray() && !configVariants.isEmpty()) {
            Map<String, List<JsonNode>> groups = new LinkedHashMap<>();
            for (JsonNode v : configVariants) {
                String mass = null;
                for (JsonNode attr : v.path("attributes")) {
                    if ("mass_grams_g".equals(attr.path("code").asText())) {
                        mass = attr.path("label").asText();
                        break;
                    }
                }
                if (mass == null) continue;
                groups.computeIfAbsent(mass, k -> new ArrayList<>()).add(v);
            }

            for (Map.Entry<String, List<JsonNode>> entry : groups.entrySet()) {
                String massLabel = entry.getKey();
                double grams = parseWeightToGrams(massLabel);
                if (grams < MIN_PACKAGE_GRAMS) {
                    log.debug("[{}] '{}' -> skipping {} (< 500g)", getStoreName(), cleanName, massLabel);
                    continue;
                }

                List<JsonNode> inStock = entry.getValue().stream()
                        .filter(v -> "IN_STOCK".equals(v.path("product").path("stock_status").asText()))
                        .collect(Collectors.toList());
                if (inStock.isEmpty()) {
                    log.debug("[{}] '{}' -> skipping {} (out of stock)", getStoreName(), cleanName, massLabel);
                    continue;
                }

                JsonNode firstProduct = inStock.get(0).path("product");

                Product variant = new Product();
                variant.setName(cleanName);
                String weightSlug = massLabel.replaceAll("\\s+", "");
                variant.setUrl(stub.getUrl() + (stub.getUrl().contains("?") ? "&" : "?") + "pakovanje=" + weightSlug);
                variant.setPrice(formatPrice(firstProduct.path("price_range").path("minimum_price")
                        .path("final_price").path("value").asDouble(0)));

                String imageUrl = firstProduct.path("image").path("url").path("full").asText(null);
                variant.setImageUrl(imageUrl != null && !imageUrl.isBlank() ? imageUrl : stub.getImageUrl());

                variant.getPackage_weight().add(weightSlug);
                variant.setPrimaryWeightGrams(grams);

                for (JsonNode v : inStock) {
                    for (JsonNode attr : v.path("attributes")) {
                        if ("flavor".equals(attr.path("code").asText())) {
                            String flavour = attr.path("label").asText().trim();
                            if (!flavour.isBlank() && !variant.getFlavours().contains(flavour))
                                variant.getFlavours().add(flavour);
                        }
                    }
                }

                variants.add(variant);
            }
        } else {
            double grams = parsePrimaryWeightFromName(cleanName);
            if (grams == 0) grams = parseWeightFromUrl(stub.getUrl());
            if (grams > 0 && grams < MIN_PACKAGE_GRAMS) {
                log.debug("[{}] '{}' -> skipping (< 500g)", getStoreName(), cleanName);
                return variants;
            }

            List<JsonNode> inStock = new ArrayList<>();
            for (JsonNode v : configVariants) {
                if ("IN_STOCK".equals(v.path("product").path("stock_status").asText())) {
                    inStock.add(v.path("product"));
                }
            }
            if (configVariants.isArray() && !configVariants.isEmpty() && inStock.isEmpty()) {
                log.debug("[{}] '{}' -> skipping (out of stock)", getStoreName(), cleanName);
                return variants;
            }

            double price = productData.path("price_range").path("minimum_price")
                    .path("final_price").path("value").asDouble(0);
            if (price == 0 && !inStock.isEmpty()) {
                price = inStock.get(0).path("price_range").path("minimum_price")
                        .path("final_price").path("value").asDouble(0);
            }

            Product variant = new Product();
            variant.setName(cleanName);
            variant.setUrl(stub.getUrl());
            variant.setPrice(formatPrice(price));

            String imageUrl = productData.path("image").path("url").path("full").asText(null);
            if ((imageUrl == null || imageUrl.isBlank()) && !inStock.isEmpty()) {
                imageUrl = inStock.get(0).path("image").path("url").path("full").asText(null);
            }
            variant.setImageUrl(imageUrl != null && !imageUrl.isBlank() ? imageUrl : stub.getImageUrl());

            if (grams > 0) {
                variant.setPrimaryWeightGrams(grams);
                variant.getPackage_weight().add(formatWeightLabel(grams));
            }

            for (JsonNode v : configVariants) {
                if (!"IN_STOCK".equals(v.path("product").path("stock_status").asText())) continue;
                for (JsonNode attr : v.path("attributes")) {
                    if ("flavor".equals(attr.path("code").asText())) {
                        String flavour = attr.path("label").asText().trim();
                        if (!flavour.isBlank() && !variant.getFlavours().contains(flavour))
                            variant.getFlavours().add(flavour);
                    }
                }
            }

            variants.add(variant);
        }

        return variants;
    }

    private static void copyNutritionFields(Product from, Product to) {
        if (to.getProteinPer100g() == null) to.setProteinPer100g(from.getProteinPer100g());
        if (to.getFatPer100g() == null) to.setFatPer100g(from.getFatPer100g());
        if (to.getSugarPer100g() == null) to.setSugarPer100g(from.getSugarPer100g());
        if (to.getCaloriePer100g() == null) to.setCaloriePer100g(from.getCaloriePer100g());
        if (to.getProteinSource() == null) to.setProteinSource(from.getProteinSource());
    }

    private static double parseWeightToGrams(String text) {
        if (text == null) return 0;
        try {
            String w = text.trim().toLowerCase().replace(",", ".").replaceAll("\\s+", "");
            if (w.endsWith("kg")) return Double.parseDouble(w.substring(0, w.length() - 2)) * 1000;
            if (w.endsWith("g")) return Double.parseDouble(w.substring(0, w.length() - 1));
        } catch (Exception ignored) {}
        return 0;
    }

    private static double parsePrimaryWeightFromName(String name) {
        if (name == null) return 0;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s?(kg|g)\\b", Pattern.CASE_INSENSITIVE).matcher(name);
        if (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1).replace(",", "."));
                return m.group(2).equalsIgnoreCase("kg") ? val * 1000 : val;
            } catch (Exception ignored) {}
        }
        return 0;
    }

    private static double parseWeightFromUrl(String url) {
        if (url == null) return 0;
        Matcher m = Pattern.compile("-(\\d{3,5})-(kg|g)-", Pattern.CASE_INSENSITIVE).matcher(url);
        if (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1));
                return m.group(2).equalsIgnoreCase("kg") ? val * 1000 : val;
            } catch (Exception ignored) {}
        }
        return 0;
    }

    private static String formatWeightLabel(double grams) {
        if (grams % 1000 == 0) return ((int) (grams / 1000)) + "kg";
        return ((int) grams) + "g";
    }

    // -------------------- Brand extraction --------------------

    private String extractBrand(JsonNode productData) {
        for (JsonNode attr : productData.path("visible_attributes")) {
            if ("manufacturer".equals(attr.path("code").asText())) {
                JsonNode values = attr.path("values");
                if (values.isArray() && !values.isEmpty()) {
                    String v = values.get(0).path("value").asText(null);
                    if (v != null && !v.isBlank()) return v.trim();
                }
            }
        }
        return null;
    }

    // -------------------- Nutrition extraction --------------------

    void extractNutritionFromTable(Document descDoc, Product p) {
        try {
            for (Element table : descDoc.select("table")) {
                String tableText = table.text().toLowerCase();
                if (!tableText.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                Elements headerCells = rows.get(0).select("th, td");
                int per100gCol = -1;
                int servingCol = -1;
                double servingGrams = 0;

                for (int i = 0; i < headerCells.size(); i++) {
                    String cellText = headerCells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                    if (cellText.contains("100g") || cellText.contains("100gr")) {
                        per100gCol = i;
                    } else {
                        Matcher m = Pattern.compile("1porcij[a-z]*\\((\\d+[.,]?\\d*)g\\)").matcher(cellText);
                        if (m.find()) {
                            servingCol = i;
                            servingGrams = Double.parseDouble(m.group(1).replace(",", "."));
                        }
                    }
                }

                int valueCol;
                double divisor;
                if (per100gCol >= 1) {
                    valueCol = per100gCol;
                    divisor = 100;
                } else if (servingCol >= 1 && servingGrams > 0) {
                    valueCol = servingCol;
                    divisor = servingGrams;
                } else {
                    continue;
                }

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= valueCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase();

                    if (label.contains("energ")) {
                        String rawCell = cells.get(valueCol).text();
                        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(rawCell);
                        if (m.find()) {
                            try {
                                double kcal = Double.parseDouble(m.group(1).replace(",", "."));
                                double kcalPer100 = divisor == 100 ? kcal : kcal / divisor * 100;
                                p.setCaloriePer100g(round1(kcalPer100));
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

                    double per100 = divisor == 100 ? value : value / divisor * 100;

                    if (label.equals("proteini") || label.equals("protein")) {
                        if (per100 > 0 && per100 <= 95) p.setProteinPer100g(round1(per100));
                    } else if (label.equals("masti") && !label.contains("zasić")) {
                        if (per100 <= 100) p.setFatPer100g(round1(per100));
                    } else if (label.contains("šećeri") || label.contains("seceri") || label.contains("šeceri")) {
                        if (per100 <= 100) p.setSugarPer100g(round1(per100));
                    }
                }

                if (p.getProteinPer100g() != null) break;
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to extract nutrition from table: {}", getStoreName(), e.getMessage());
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
