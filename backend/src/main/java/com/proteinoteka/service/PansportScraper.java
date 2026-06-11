package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.LoadState;
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

@Component
@Slf4j
@RequiredArgsConstructor
public class PansportScraper implements StoreScraper {

    private static final String STORE_NAME = "Pansport";
    private static final String BASE_URL = "https://www.pansport.rs/proteini";
    private static final double MIN_WEIGHT_GRAMS = 100.0; // skip sachets

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ProductRepository productRepository;
    private final PriceParser priceParser;

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl()   { return BASE_URL; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("li.pager__item--next a") != null;
    }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + page;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("div.product-teaser");
        log.info("[{}] Found {} products on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            List<Product> variants = parseVariants(el);
            products.addAll(variants);
            if (!variants.isEmpty()) {
                log.info("[{}] '{}' → {} pakovanje varijanti",
                        STORE_NAME, variants.get(0).getName(), variants.size());
            }
        }

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products, skipUrls);
        }

        return products;
    }

    // ── Listing parsing ─────────────────────────────────────────────────────────

    private List<Product> parseVariants(Element element) {
        List<Product> variants = new ArrayList<>();

        Element titleEl = element.selectFirst("h4.node__title a");
        if (titleEl == null) return variants;
        String name = titleEl.text().trim();

        // Base URL — strip query params (?sku=...) to get canonical base
        Element linkEl = element.selectFirst("div.details a");
        if (linkEl == null) return variants;
        String href = linkEl.attr("href");
        if (href.contains("?")) href = href.substring(0, href.indexOf("?"));
        String baseProductUrl = href.startsWith("http") ? href : "https://www.pansport.rs" + href;

        // Image
        String imageUrl = extractListingImage(element);

        // Short description
        String description = null;
        Element descEl = element.selectFirst("div.field__item");
        if (descEl != null) description = descEl.text().trim();

        // Flavours (same for all variants)
        List<String> flavours = new ArrayList<>();
        for (Element opt : element.select("select[id^=edit-attributes-field-attr-ukus] option")) {
            String f = opt.text().trim();
            if (!f.isBlank() && !f.equals("--")) flavours.add(f);
        }

        // Price shown on listing (corresponds to selected/default variant)
        String selectedPrice = null;
        Element priceEl = element.selectFirst("td.price-amount");
        if (priceEl != null) {
            selectedPrice = priceEl.text()
                    .replace(" ", "")
                    .replaceAll("(?i)rsd", "")
                    .trim();
        }

        Elements weightOptions = element.select("select[id^=edit-attributes-field-attr-pakovanje] option");

        if (weightOptions.isEmpty()) {
            // Product with no weight variants — single entry
            Product p = buildProduct(name, baseProductUrl, imageUrl, description, flavours);
            p.setPrice(selectedPrice);
            variants.add(p);
        } else {
            for (Element opt : weightOptions) {
                String skuValue = opt.attr("value");
                String weightText = normalizeWeight(opt.text().trim());
                Double weightGrams = parseWeightToGrams(weightText);

                if (weightGrams == null || weightGrams < MIN_WEIGHT_GRAMS) {
                    log.debug("[{}] Skipping sachet option '{}' for '{}'", STORE_NAME, weightText, name);
                    continue;
                }

                String variantUrl = baseProductUrl + "?sku=" + skuValue;
                Product p = buildProduct(name, variantUrl, imageUrl, description, flavours);
                p.setPrimaryWeightGrams(weightGrams);
                p.getPackage_weight().add(weightText);

                // Pre-fill price for the selected variant — others need detail page
                if (opt.hasAttr("selected")) {
                    p.setPrice(selectedPrice);
                }

                variants.add(p);
            }
        }

        return variants;
    }

    private Product buildProduct(String name, String url, String imageUrl,
                                  String description, List<String> flavours) {
        Product p = new Product();
        p.setName(name);
        p.setUrl(url);
        p.setImageUrl(imageUrl);
        p.setDescription(description);
        p.getFlavours().addAll(flavours);
        return p;
    }

    private String extractListingImage(Element element) {
        Element img = element.selectFirst("div.teaser-image img");
        if (img == null) return null;
        String src = img.attr("src");
        if (src.isBlank()) src = img.attr("data-src");
        if (!src.isBlank() && !src.startsWith("http")) src = "https://www.pansport.rs" + src;
        return src.isBlank() ? null : src;
    }

    // ── Detail page enrichment ──────────────────────────────────────────────────

    private void enrichWithDetails(Page page, List<Product> products, Set<String> skipUrls) {
        // Group variants by base URL — navigate once per product, switch variants via dropdown
        Map<String, List<Product>> byBase = new LinkedHashMap<>();
        for (Product p : products) {
            byBase.computeIfAbsent(stripSku(p.getUrl()), k -> new ArrayList<>()).add(p);
        }

        int count = 0;

        for (Map.Entry<String, List<Product>> entry : byBase.entrySet()) {
            String baseUrl = entry.getKey();
            List<Product> variants = entry.getValue();

            if (canSkipGroup(variants, skipUrls)) {
                log.info("[{}] Skipping '{}' group — price unchanged + nutrition complete in DB",
                        STORE_NAME, variants.get(0).getName());
                for (Product p : variants) restoreFromDb(p);
                continue;
            }

            try {
                long sleep = 4000 + ThreadLocalRandom.current().nextLong(4000);
                log.info("[{}] Sleeping {}s before '{}' group ({} variants)...",
                        STORE_NAME, sleep / 1000, variants.get(0).getName(), variants.size());
                Thread.sleep(sleep);

                // Navigate to base URL ONCE per product — Drupal loads default (selected) variant
                boolean success = navigateWithRetry(page, baseUrl, 3);
                if (!success) {
                    log.error("[{}] Failed to load {} — skipping group", STORE_NAME, baseUrl);
                    continue;
                }

                if (isBlockedByFirewall(page)) {
                    log.error("[{}] FIREWALL DETECTED! Stopping.", STORE_NAME);
                    return;
                }

                simulateHumanBehavior(page);

                // Process the already-selected (default) variant first; switch dropdown for others.
                // The selected variant has its listing price pre-filled; non-selected have price=null.
                List<Product> ordered = new ArrayList<>(variants);
                ordered.sort((a, b) -> Boolean.compare(
                        a.getPrice() == null || a.getPrice().isBlank(),
                        b.getPrice() == null || b.getPrice().isBlank()));

                Product nutritionDonor = null;

                for (int i = 0; i < ordered.size(); i++) {
                    Product p = ordered.get(i);
                    if (p.getUrl() == null || p.getUrl().isBlank()) continue;
                    if (baseEnricher.isNonProteinProduct(p.getName())) {
                        log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, p.getName());
                        continue;
                    }

                    // For non-first variants, switch the pakovanje dropdown and wait for AJAX
                    if (i > 0 && variants.size() > 1) {
                        String termId = extractTermId(p.getUrl());
                        if (termId != null) {
                            try {
                                page.selectOption("select[id^=edit-attributes-field-attr-pakovanje]", termId);
                                page.waitForLoadState(LoadState.NETWORKIDLE,
                                        new Page.WaitForLoadStateOptions().setTimeout(10000));
                                page.waitForTimeout(500 + ThreadLocalRandom.current().nextInt(500));
                                log.info("[{}] Switched to variant termId={} ({}g)", STORE_NAME, termId,
                                        p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) : "?");
                            } catch (Exception e) {
                                log.warn("[{}] Failed to switch to variant {} for '{}': {}",
                                        STORE_NAME, termId, p.getName(), e.getMessage());
                            }
                        }
                    }

                    Document doc = Jsoup.parse(page.content());

                    enrichPriceFromDetail(doc, p);
                    enrichImageFromDetail(doc, p);

                    if (nutritionDonor == null) {
                        enrichBrand(doc, p);
                        enrichFullDescription(doc, p);
                    } else {
                        p.setBrand(nutritionDonor.getBrand());
                    }

                    if (nutritionDonor != null) {
                        copyNutrition(nutritionDonor, p);
                    } else if (!skipUrls.contains(p.getUrl())) {
                        enrichNutrition(doc, p);
                        if (p.getProteinPer100g() != null) nutritionDonor = p;
                    }

                    log.info("[{}] Enriched '{}' {}g → price={}, protein={}g/100g",
                            STORE_NAME, p.getName(),
                            p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) : "?",
                            p.getPrice(), p.getProteinPer100g());

                    count++;
                    if (count % 10 == 0) {
                        long batchSleep = 40000 + ThreadLocalRandom.current().nextLong(20000);
                        log.info("[{}] Batch pause {}s after {} products...", STORE_NAME, batchSleep / 1000, count);
                        Thread.sleep(batchSleep);
                    }
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich group {}: {}", STORE_NAME, baseUrl, e.getMessage());
                safeSleep(5000);
            }
        }
    }

    private String extractTermId(String url) {
        if (url == null) return null;
        int idx = url.indexOf("?sku=");
        if (idx < 0) return null;
        return url.substring(idx + 5);
    }

    // ── Skip-if-unchanged optimization ──────────────────────────────────────────

    private boolean canSkipGroup(List<Product> variants, Set<String> skipUrls) {
        // All variants must have complete nutrition in DB
        if (variants.stream().anyMatch(v -> !skipUrls.contains(v.getUrl()))) return false;

        // Find the selected variant (has listing price set)
        Product selected = variants.stream()
                .filter(v -> v.getPrice() != null && !v.getPrice().isBlank())
                .findFirst().orElse(null);
        if (selected == null) return false;

        // Check listing price vs DB price
        Product dbProduct = productRepository.findByUrl(selected.getUrl()).orElse(null);
        if (dbProduct == null || dbProduct.getNumericPrice() == null) return false;

        Double listingPrice = priceParser.parse(selected.getPrice());
        if (listingPrice == null) return false;

        return Math.abs(listingPrice - dbProduct.getNumericPrice()) < 1.0;
    }

    private void restoreFromDb(Product p) {
        productRepository.findByUrl(p.getUrl()).ifPresent(db -> {
            p.setPrice(db.getPrice());
            p.setProteinPer100g(db.getProteinPer100g());
            p.setFatPer100g(db.getFatPer100g());
            p.setSugarPer100g(db.getSugarPer100g());
            p.setCaloriePer100g(db.getCaloriePer100g());
            p.setProteinSource(db.getProteinSource());
            p.setBrand(db.getBrand());
            p.setImageUrl(db.getImageUrl());
            if (p.getPrimaryWeightGrams() == null) p.setPrimaryWeightGrams(db.getPrimaryWeightGrams());
        });
    }

    private void enrichPriceFromDetail(Document doc, Product p) {
        // Always fetch from detail page — NETWORKIDLE ensures AJAX price update has completed
        Element priceEl = doc.selectFirst("td.price-amount, span.price-amount, .field--name-price .field__item");
        if (priceEl != null) {
            String price = priceEl.text()
                    .replace(" ", "")
                    .replaceAll("(?i)rsd", "")
                    .trim();
            if (!price.isBlank()) p.setPrice(price);
        }
    }

    private void enrichImageFromDetail(Document doc, Product p) {
        Element img = doc.selectFirst("div.field--name-field-image img, div.product-image img");
        if (img != null) {
            String src = img.attr("src");
            if (!src.isBlank()) {
                if (!src.startsWith("http")) src = "https://www.pansport.rs" + src;
                p.setImageUrl(src);
            }
        }
    }

    private void copyNutrition(Product from, Product to) {
        if (to.getProteinPer100g() == null) to.setProteinPer100g(from.getProteinPer100g());
        if (to.getFatPer100g() == null)     to.setFatPer100g(from.getFatPer100g());
        if (to.getSugarPer100g() == null)   to.setSugarPer100g(from.getSugarPer100g());
        if (to.getCaloriePer100g() == null) to.setCaloriePer100g(from.getCaloriePer100g());
        if (to.getProteinSource() == null)  to.setProteinSource(from.getProteinSource());
    }

    // ── Nutrition extraction ────────────────────────────────────────────────────

    private void enrichNutrition(Document doc, Product p) {
        extractNutritionFromTable(doc, p);
        if (p.getProteinPer100g() == null && p.getDescription() != null) {
            Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }
        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
        log.info("[{}] '{}' -> protein: {}, sugar: {}, fat: {}, cal: {}",
                STORE_NAME, p.getName(), p.getProteinPer100g(),
                p.getSugarPer100g(), p.getFatPer100g(), p.getCaloriePer100g());
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        try {
            for (Element table : doc.select("table")) {
                String tableText = table.text().toLowerCase();
                if (!tableText.contains("proteini") && !tableText.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                int per100gCol = -1;
                Elements headerCells = rows.get(0).select("th, td");
                for (int i = 0; i < headerCells.size(); i++) {
                    String cell = headerCells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                    if (cell.contains("100g") || cell.contains("na100") || cell.contains("per100")) {
                        per100gCol = i;
                        break;
                    }
                }
                if (per100gCol < 0) per100gCol = 2;

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase();
                    String rawValue = cells.get(per100gCol).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();
                    if (rawValue.isBlank()) continue;

                    double value;
                    try { value = Double.parseDouble(rawValue); } catch (Exception e) { continue; }
                    if (value < 0 || value > 1000) continue;

                    if ((label.contains("proteini") || label.contains("belančevine"))
                            && !label.contains("koncentrat") && !label.contains("izvor")) {
                        if (value > 0 && value <= 95) p.setProteinPer100g(value);
                    } else if ((label.contains("masti") || label.equals("fat"))
                            && !label.contains("zasićene")) {
                        if (value <= 100) p.setFatPer100g(value);
                    } else if (label.contains("šećeri") || label.contains("seceri") || label.contains("sugar")
                            || (label.contains("ugljeni hidrati") && label.contains("šećer"))) {
                        if (value <= 100) p.setSugarPer100g(value);
                    } else if (label.contains("energetska") || label.contains("kalorij")
                            || label.contains("kcal") || label.contains("energy")) {
                        p.setCaloriePer100g(value);
                    }
                }

                if (p.getProteinPer100g() != null) break;
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to extract nutrition from table: {}", STORE_NAME, e.getMessage());
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private void enrichBrand(Document doc, Product p) {
        Element brand = doc.selectFirst("div.field--name-field-manufacturer a");
        if (brand != null) {
            String text = brand.text().trim().replaceAll("[\\uFFFD\\u0000-\\u001F]", "").trim();
            if (!text.isBlank()) p.setBrand(text);
        }
    }

    private void enrichFullDescription(Document doc, Product p) {
        Element el = doc.selectFirst("div#node-product-body");
        if (el != null) {
            String text = el.text().trim();
            if (!text.isBlank()) p.setDescription(text);
        }
    }

    private static String stripSku(String url) {
        if (url == null) return "";
        int q = url.indexOf("?");
        return q >= 0 ? url.substring(0, q) : url;
    }

    private String normalizeWeight(String weight) {
        return weight.replaceAll("\\s*\\(.*?\\)", "").replaceAll("\\s+", "").trim();
    }

    private Double parseWeightToGrams(String weight) {
        try {
            String w = weight.toLowerCase().replace(",", ".").replaceAll("\\s+", "");
            if (w.contains("kg")) return Double.parseDouble(w.replace("kg", "")) * 1000;
            if (w.contains("g"))  return Double.parseDouble(w.replace("g", ""));
        } catch (Exception ignored) {}
        return null;
    }

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.NETWORKIDLE)
                        .setTimeout(30000));
                page.waitForTimeout(800 + ThreadLocalRandom.current().nextInt(1200));
                return true;
            } catch (Exception e) {
                log.warn("[{}] Navigate retry {}/{} for {}: {}", STORE_NAME, i + 1, maxRetries, url, e.getMessage());
                if (i < maxRetries - 1) safeSleep(2000 * (i + 1));
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

    private void simulateHumanBehavior(Page page) {
        try {
            page.mouse().wheel(0, 200 + ThreadLocalRandom.current().nextInt(300));
            Thread.sleep(300 + ThreadLocalRandom.current().nextInt(400));
            page.mouse().wheel(0, 300 + ThreadLocalRandom.current().nextInt(200));
            Thread.sleep(200 + ThreadLocalRandom.current().nextInt(300));
            page.mouse().wheel(0, -150 - ThreadLocalRandom.current().nextInt(100));
            Thread.sleep(200 + ThreadLocalRandom.current().nextInt(200));
        } catch (Exception ignored) {}
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
