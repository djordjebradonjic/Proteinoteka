package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProteinboxScraper implements StoreScraper {

    private static final String STORE_NAME = "Proteinbox";
    private static final String BASE_URL = "https://proteinbox.rs/c/proteini/";

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${playwright.proxy.enabled:false}")
    private boolean proxyEnabled;

    @org.springframework.beans.factory.annotation.Value("${playwright.proxy.host:geo.iproyal.com}")
    private String proxyHost;

    @org.springframework.beans.factory.annotation.Value("${playwright.proxy.port:12321}")
    private int proxyPort;

    @org.springframework.beans.factory.annotation.Value("${playwright.proxy.username:}")
    private String proxyUsername;

    @org.springframework.beans.factory.annotation.Value("${playwright.proxy.password:}")
    private String proxyPassword;


    @Override
    public String getStoreName() { return STORE_NAME; }

    @Override
    public String getBaseUrl() { return BASE_URL; }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("a.next.page-numbers") != null;
    }

    @Override
    public void waitForListing(Page page) {
        // Proteinbox serves a stripped page to headless browsers (bot detection).
        // If li.product doesn't appear in 8s, fall back to a plain JSoup HTTP fetch
        // and inject the real HTML into the Playwright page so the rest of the pipeline
        // (scrape, hasNextPage) works normally with accurate content.
        try {
            page.waitForSelector("li.product",
                    new Page.WaitForSelectorOptions().setTimeout(8000));
            // Give WooCommerce JS time to populate variable product prices
            page.waitForTimeout(2500);
        } catch (Exception e) {
            log.warn("[{}] Playwright blocked — falling back to JSoup for listing: {}", STORE_NAME, page.url());
            try {
                if (proxyEnabled && !proxyHost.isBlank() && !proxyUsername.isBlank()) {
                    java.net.Authenticator.setDefault(new java.net.Authenticator() {
                        @Override
                        protected java.net.PasswordAuthentication getPasswordAuthentication() {
                            return new java.net.PasswordAuthentication(proxyUsername, proxyPassword.toCharArray());
                        }
                    });
                }
                org.jsoup.Connection conn = Jsoup.connect(page.url())
                        .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                        .header("Accept-Language", "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7")
                        .header("Accept-Encoding", "gzip, deflate, br")
                        .referrer("https://www.google.com/")
                        .timeout(15000);
                if (proxyEnabled && !proxyHost.isBlank()) {
                    conn = conn.proxy(proxyHost, proxyPort);
                }
                String html = conn.get().html();
                page.setContent(html);
                log.info("[{}] JSoup fallback succeeded — injected real HTML into page", STORE_NAME);
            } catch (Exception jsoupEx) {
                log.error("[{}] JSoup fallback also failed: {}", STORE_NAME, jsoupEx.getMessage());
            }
        }
    }

    @Override
    public String buildPageUrl(int page) {
        // Proteinbox uses /page/2/, /page/3/ etc. (1-indexed), scraper uses 0-indexed
        return page == 0 ? BASE_URL : BASE_URL + "page/" + (page + 1) + "/";
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, java.util.Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, java.util.Set<String> skipUrls) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("li.product");
        log.info("[{}] Found {} products on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) products.add(p);
            else log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
        }

        if (page != null) {
            return enrichWithDetails(page, products, skipUrls);
        }
        log.info("[{}] Skipping enrichment (page is null)", STORE_NAME);
        return products;
    }

    // -------------------- Detail page enrichment --------------------

    private List<Product> enrichWithDetails(Page page, List<Product> products, java.util.Set<String> skipUrls) {
        if (page.title().contains("Cloudflare") || page.title().contains("Attention Required")) {
            log.error("[{}] DETECTED BY FIREWALL! Stopping scraper.", STORE_NAME);
            return products;
        }

        List<Product> result = new ArrayList<>();
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' - not a protein product", STORE_NAME, p.getName());
                continue;
            }

            try {
                if (!navigateWithRetry(page, p.getUrl(), 3)) {
                    log.error("[{}] Failed to load {} after retries, skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                if (isBlocked(page)) {
                    log.warn("[{}] FIREWALL on {}, skipping product", STORE_NAME, p.getUrl());
                    continue;
                }

                page.waitForTimeout(500 + (long)(Math.random() * 1000));
                clickSastavTab(page);

                Document doc = Jsoup.parse(page.content());

                // Try to expand multi-package products via WooCommerce variations JSON
                List<Product> variants = expandVariants(doc, p, skipUrls);

                if (variants.size() > 1) {
                    // Multi-package: price/weight/flavours already set per variant from JSON.
                    // Navigate once, enrich nutrition once, copy to all.
                    enrichBrand(doc, variants.get(0));
                    enrichDescription(doc, variants.get(0));

                    boolean anyNeedsNutrition = variants.stream()
                            .anyMatch(v -> !skipUrls.contains(v.getUrl()));
                    if (anyNeedsNutrition) {
                        enrichNutrition(doc, variants.get(0));
                    }

                    for (int i = 0; i < variants.size(); i++) {
                        Product v = variants.get(i);
                        if (i > 0) {
                            v.setBrand(variants.get(0).getBrand());
                            v.setDescription(variants.get(0).getDescription());
                            copyNutritionFields(variants.get(0), v);
                        }
                        enrichImageIfMissing(doc, v);
                        log.info("[{}] Variant '{}' {}→ price={}, protein={}",
                                STORE_NAME, v.getName(),
                                v.getPrimaryWeightGrams() != null ? Math.round(v.getPrimaryWeightGrams()) + "g " : "",
                                v.getPrice(), v.getProteinPer100g());
                    }
                    result.addAll(variants);
                } else {
                    // Single-variant or JSON parse failed — original flow
                    if (!skipUrls.contains(p.getUrl())) {
                        enrichPriceIfMissing(doc, p);
                        enrichBrand(doc, p);
                        enrichPackageWeights(doc, p);
                        enrichFlavours(doc, p);
                        enrichDescription(doc, p);
                        enrichNutrition(doc, p);
                        enrichImageIfMissing(doc, p);
                    } else {
                        log.debug("[{}] Skipping detail enrichment for '{}' — nutrition complete", STORE_NAME, p.getName());
                        enrichPriceIfMissing(doc, p);
                    }
                    log.info("[{}] Enriched '{}' -> brand={}, protein={}, fat={}, sugar={}, cal={}",
                            STORE_NAME, p.getName(), p.getBrand(),
                            p.getProteinPer100g(), p.getFatPer100g(),
                            p.getSugarPer100g(), p.getCaloriePer100g());
                    result.add(p);
                }

                count++;
                if (count % 20 == 0) {
                    long batchSleep = ThreadLocalRandom.current().nextLong(35_000, 55_000);
                    log.info("[{}] Batch of 20 done, sleeping {}s...", STORE_NAME, batchSleep / 1000);
                    Thread.sleep(batchSleep);
                } else {
                    Thread.sleep(ThreadLocalRandom.current().nextLong(4000, 8000));
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}", STORE_NAME, p.getName(), e.getMessage());
                try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
            }
        }

        return result;
    }

    // -------------------- Multi-package expansion --------------------

    /**
     * Reads the WooCommerce data-product_variations JSON from the detail page.
     * Returns one Product per unique "pakovanje" attribute when there are multiple package sizes.
     * Returns empty list for single-pakovanje products (caller handles them in the original flow).
     * URL format: baseUrl?pakovanje=<slug> (e.g. ?pakovanje=908g), matching PansportScraper's ?sku= pattern.
     */
    private List<Product> expandVariants(Document doc, Product original, java.util.Set<String> skipUrls) {
        List<Product> variants = new ArrayList<>();
        try {
            Element form = doc.selectFirst("form.variations_form[data-product_variations]");
            if (form == null) return variants;

            String json = form.attr("data-product_variations");
            if (json == null || json.isBlank()) return variants;

            JsonNode arr = objectMapper.readTree(json);
            if (!arr.isArray() || arr.size() == 0) return variants;

            // Slug → display text from hidden <select> elements
            Map<String, String> pakSlugToText = new LinkedHashMap<>();
            for (Element opt : doc.select("select[name=attribute_pa_pakovanje] option")) {
                String val = opt.attr("value").trim();
                String text = opt.text().trim();
                if (!val.isBlank() && !text.isBlank()) pakSlugToText.put(val, text);
            }
            if (pakSlugToText.size() <= 1) return variants; // single pakovanje — don't expand

            Map<String, String> ukusSlugToText = new LinkedHashMap<>();
            for (Element opt : doc.select("select[name=attribute_pa_ukus] option")) {
                String val = opt.attr("value").trim();
                String text = opt.text().trim();
                if (!val.isBlank() && !text.isBlank()) ukusSlugToText.put(val, text);
            }

            // Collect per-pakovanje: first seen price, flavours, image
            Map<String, Double> pakToPrice = new LinkedHashMap<>();
            Map<String, List<String>> pakToFlavours = new LinkedHashMap<>();
            Map<String, String> pakToImage = new LinkedHashMap<>();

            for (JsonNode v : arr) {
                String pakSlug = v.path("attributes").path("attribute_pa_pakovanje").asText("").trim();
                if (pakSlug.isBlank()) continue;

                double price = v.path("display_price").asDouble(0);
                String ukusSlug = v.path("attributes").path("attribute_pa_ukus").asText("").trim();
                String imgSrc  = v.path("image").path("src").asText("").trim();

                pakToPrice.putIfAbsent(pakSlug, price);
                pakToFlavours.computeIfAbsent(pakSlug, k -> new ArrayList<>());
                if (!ukusSlug.isBlank()) {
                    String display = ukusSlugToText.getOrDefault(ukusSlug, ukusSlug);
                    if (!pakToFlavours.get(pakSlug).contains(display))
                        pakToFlavours.get(pakSlug).add(display);
                }
                pakToImage.putIfAbsent(pakSlug, imgSrc);
            }

            String baseUrl = original.getUrl();

            for (Map.Entry<String, Double> entry : pakToPrice.entrySet()) {
                String pakSlug = entry.getKey();
                double price   = entry.getValue();

                String displayWeight = pakSlugToText.get(pakSlug);
                if (displayWeight == null) continue;

                double weightGrams = parseWeightToGrams(displayWeight);
                String variantUrl  = baseUrl + "?pakovanje=" + pakSlug;

                Product variant = new Product();
                variant.setName(original.getName());
                variant.setUrl(variantUrl);
                String imgSrc = pakToImage.getOrDefault(pakSlug, "");
                variant.setImageUrl(!imgSrc.isBlank() ? imgSrc : original.getImageUrl());
                variant.setPrice(formatPrice(price));
                if (weightGrams > 0) {
                    variant.setPrimaryWeightGrams(weightGrams);
                    variant.getPackage_weight().add(displayWeight.replaceAll("\\s+", ""));
                }
                variant.getFlavours().addAll(pakToFlavours.getOrDefault(pakSlug, new ArrayList<>()));

                variants.add(variant);
                log.info("[{}] JSON variant: '{}' pak={} price={} weight={}g",
                        STORE_NAME, original.getName(), displayWeight, (long) price, (long) weightGrams);
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to expand variants for '{}': {}", STORE_NAME, original.getName(), e.getMessage());
        }
        return variants;
    }

    private static double parseWeightToGrams(String text) {
        if (text == null) return 0;
        try {
            String w = text.trim().toLowerCase().replace(",", ".").replaceAll("\\s+", "");
            if (w.contains("kg")) return Double.parseDouble(w.replace("kg", "")) * 1000;
            if (w.contains("g"))  return Double.parseDouble(w.replace("g", ""));
        } catch (Exception ignored) {}
        return 0;
    }

    private static String formatPrice(double price) {
        return String.valueOf(Math.round(price));
    }

    private static void copyNutritionFields(Product from, Product to) {
        if (to.getProteinPer100g() == null)  to.setProteinPer100g(from.getProteinPer100g());
        if (to.getFatPer100g() == null)       to.setFatPer100g(from.getFatPer100g());
        if (to.getSugarPer100g() == null)     to.setSugarPer100g(from.getSugarPer100g());
        if (to.getCaloriePer100g() == null)   to.setCaloriePer100g(from.getCaloriePer100g());
        if (to.getProteinSource() == null)    to.setProteinSource(from.getProteinSource());
    }

    // -------------------- Image extraction --------------------

    private void enrichImageIfMissing(Document doc, Product p) {
        if (p.getImageUrl() != null && !p.getImageUrl().isBlank()) return;
        // WooCommerce product gallery — main image
        for (String selector : new String[]{
                ".woocommerce-product-gallery__image img",
                "img.wp-post-image",
                ".product_gallery img",
                ".woocommerce-main-image img"
        }) {
            Element img = doc.selectFirst(selector);
            if (img == null) continue;
            String src = img.attr("src");
            if (src.isEmpty() || src.startsWith("data:")) src = img.attr("data-src");
            if (!src.isEmpty() && !src.startsWith("data:")) {
                p.setImageUrl(src);
                return;
            }
        }
    }

    // -------------------- Nutrition extraction --------------------

    private void enrichNutrition(Document doc, Product p) {
        // Tab 2 - "Sastav"
        Element sastavTab = doc.selectFirst("[id$='02'][role='tabpanel']");
        if (sastavTab != null) {
            extractNutritionFromTable(sastavTab, p);
        }

        // Fallback - entire doc
        if (p.getProteinPer100g() == null) {
            extractNutritionFromTable(doc, p);
        }

        // Fallback - description text
        if (p.getProteinPer100g() == null && p.getDescription() != null) {
            Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }
        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);


        log.info("[{}] '{}' -> protein: {}, sugar: {}, fat: {}, cal: {}",
                STORE_NAME, p.getName(),
                p.getProteinPer100g(), p.getSugarPer100g(),
                p.getFatPer100g(), p.getCaloriePer100g());
    }


    private void extractNutritionFromTable(Element root, Product p) {
        // First try div#sastav explicitly
        Element sastavDiv = root.selectFirst("div#sastav");
        if (sastavDiv != null) {
            Element table = sastavDiv.selectFirst("table");
            extractFromTable(table, p);
            if (p.getProteinPer100g() == null) {
                // per-serving table (e.g. "Po Serviranju (30g)") — convert to per-100g
                extractNutritionFromServingTable(table, p);
            }
            if (p.getProteinPer100g() != null) return;
        }

        // Fallback — search all tables
        for (Element t : root.select("table")) {
            String text = t.text().toLowerCase();
            if (text.contains("proteini") || text.contains("belančevine")) {
                if (text.contains("100")) {
                    extractFromTable(t, p);
                } else {
                    extractNutritionFromServingTable(t, p);
                }
                if (p.getProteinPer100g() != null) return;
            }
        }
    }

    private void extractFromTable(Element table, Product p) {
        if (table == null) return;

        try {
            Elements rows = table.select("tr");
            if (rows.isEmpty()) return;

            // Detect 100g column — Proteinbox: | Nutrient | 30g | 100g | RU% |
            int per100gCol = -1;
            for (Element row : rows) {
                Elements cells = row.select("th, td");
                for (int i = 0; i < cells.size(); i++) {
                    String cellText = cells.get(i).text().trim().toLowerCase().replaceAll("\\s+", "");
                    if (cellText.contains("100g") || cellText.contains("100gr")) {
                        per100gCol = i;
                        break;
                    }
                }
                if (per100gCol >= 0) break;
            }

            if (per100gCol < 0) return;

            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() <= per100gCol) continue;

                String label = cells.get(0).text().trim().toLowerCase();
                String rawCellText = cells.get(per100gCol).text();

                // Calories must be handled before numeric range check —
                // combined format "1638 kj / 386 kcal" concatenates to 1638386 which exceeds 10000
                if (label.contains("energij") || label.contains("energetska")
                        || label.contains("kalorij") || label.contains("energy")) {
                    Matcher kcalM = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal",
                            Pattern.CASE_INSENSITIVE).matcher(rawCellText);
                    if (kcalM.find()) {
                        try {
                            p.setCaloriePer100g(Double.parseDouble(
                                    kcalM.group(1).replace(",", ".")));
                        } catch (Exception ignored) {}
                    }
                    continue;
                }

                String rawValue = rawCellText.replaceAll("[^0-9,.]", "").replace(",", ".").trim();
                if (rawValue.isBlank()) continue;

                double value;
                try { value = Double.parseDouble(rawValue); }
                catch (Exception e) { continue; }

                if (value < 0 || value > 10000) continue;

                // Protein
                if ((label.equals("proteini") || label.contains("belančevine"))
                        && !label.contains("koncentrat")) {
                    if (value > 0 && value <= 95) p.setProteinPer100g(value);
                }
                // Fat — samo "Masti", ne "zasićene"
                else if (label.equals("masti") || label.equals("fat")) {
                    if (value <= 100) p.setFatPer100g(value);
                }
                // Sugar — "Od čega šećeri"
                else if (label.contains("šećeri") || label.contains("seceri")
                        || label.contains("sugar")) {
                    if (value <= 100) p.setSugarPer100g(value);
                }
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to parse table: {}", STORE_NAME, e.getMessage());
        }
    }

    private void extractNutritionFromServingTable(Element table, Product p) {
        try {
            // Find serving size from table header or caption
            Double servingSize = null;
            String tableText = table.text();

            Pattern servingPattern = Pattern.compile(
                    "doziranje[:\\s]*(\\d+[.,]?\\d*)\\s*g|" +
                            "porcij[ia][:\\s]*(\\d+[.,]?\\d*)\\s*g|" +
                            "\\(\\s*(\\d+[.,]?\\d*)\\s*g\\s*\\)",
                    Pattern.CASE_INSENSITIVE
            );
            Matcher m = servingPattern.matcher(tableText);
            if (m.find()) {
                for (int i = 1; i <= m.groupCount(); i++) {
                    if (m.group(i) != null) {
                        servingSize = Double.parseDouble(m.group(i).replace(",", "."));
                        break;
                    }
                }
            }

            if (servingSize == null || servingSize <= 0) return;

            double serving = servingSize;

            for (Element row : table.select("tr")) {
                Elements cells = row.select("td");
                if (cells.size() < 2) continue;

                String label = cells.get(0).text().trim().toLowerCase();
                String rawValue = cells.get(1).text()
                        .replaceAll("[^0-9,.]", "").replace(",", ".").trim();

                if (rawValue.isBlank()) continue;

                double value;
                try { value = Double.parseDouble(rawValue); }
                catch (Exception e) { continue; }

                double per100g = Math.round((value / serving * 100) * 10.0) / 10.0;

                if ((label.contains("proteini") || label.contains("belančevine"))
                        && !label.contains("koncentrat")) {
                    if (per100g > 0 && per100g <= 95) p.setProteinPer100g(per100g);
                } else if (label.contains("masti") || label.contains("ukupne masti")) {
                    if (per100g <= 100) p.setFatPer100g(per100g);
                } else if (label.contains("šećeri") || label.contains("seceri")) {
                    if (per100g <= 100) p.setSugarPer100g(per100g);
                } else if (label.contains("energij") || label.contains("energetska") || label.contains("kcal")) {
                    // Cell value may be "121,6 kcal" — extract numeric part only
                    String rawCell = cells.get(1).text();
                    Matcher kcalM = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(rawCell);
                    double servingKcal = kcalM.find()
                            ? Double.parseDouble(kcalM.group(1).replace(",", "."))
                            : value;
                    double calPer100g = Math.round((servingKcal / serving * 100) * 10.0) / 10.0;
                    p.setCaloriePer100g(calPer100g);
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to parse serving table: {}", STORE_NAME, e.getMessage());
        }
    }

    // -------------------- Other enrichment --------------------

    private void enrichPriceIfMissing(Document doc, Product p) {
        if (p.getPrice() != null && !p.getPrice().isBlank() && !p.getPrice().startsWith("0")) return;
        // Variable products show 0,00 in listing — try to get real price from detail page
        Element priceEl = doc.selectFirst(".summary .price .woocommerce-Price-amount.amount bdi");
        if (priceEl == null) priceEl = doc.selectFirst(".price .woocommerce-Price-amount.amount bdi");
        if (priceEl != null) {
            String raw = priceEl.text().replace(" ", "").replace("RSD", "").trim();
            if (!raw.isBlank() && !raw.startsWith("0")) {
                p.setPrice(raw);
                log.info("[{}] Updated price from detail page for '{}': {}", STORE_NAME, p.getName(), raw);
            }
        }
    }

    private void enrichBrand(Document doc, Product p) {
        Element brandEl = doc.selectFirst("div.product-proizvodjaci a");
        if (brandEl == null) brandEl = doc.selectFirst("a[href*='/proizvodjaci/']");
        if (brandEl != null) p.setBrand(brandEl.text().trim());
    }

    private void enrichPackageWeights(Document doc, Product p) {
        Elements options = doc.select("select[name=attribute_pa_pakovanje] option");
        List<String> weights = new ArrayList<>();
        for (Element opt : options) {
            if (opt.attr("value").isBlank()) continue;
            String weight = opt.text().trim().replaceAll("\\s+", "");
            if (!weight.isBlank() && !weights.contains(weight)) weights.add(weight);
        }
        if (!weights.isEmpty()) {
            p.getPackage_weight().clear();
            p.getPackage_weight().addAll(weights);
        }
    }

    private void enrichFlavours(Document doc, Product p) {
        Elements options = doc.select("select[name=attribute_pa_ukus] option");
        for (Element opt : options) {
            if (opt.attr("value").isBlank()) continue;
            String flavour = opt.text().trim();
            if (!flavour.isBlank() && !p.getFlavours().contains(flavour))
                p.getFlavours().add(flavour);
        }
    }

    private void enrichDescription(Document doc, Product p) {
        StringBuilder fullDescription = new StringBuilder();

        // Tab 1 - "Opis"
        Element opisTab = doc.selectFirst("[id$='01'][role='tabpanel']");
        if (opisTab != null && !opisTab.text().isBlank()) {
            fullDescription.append(opisTab.text().trim());
        }

        // Tab 2 - "Sastav" — dodaj nutrition tabelu u description
        Element sastavTab = doc.selectFirst("[id$='02'][role='tabpanel']");
        if (sastavTab != null && !sastavTab.text().isBlank()) {
            if (fullDescription.length() > 0) fullDescription.append("\n\n");
            fullDescription.append(sastavTab.text().trim());
        }

        // Fallback
        if (fullDescription.isEmpty()) {
            Element shortDesc = doc.selectFirst("div.woocommerce-product-details__short-description");
            if (shortDesc != null && !shortDesc.text().isBlank())
                fullDescription.append(shortDesc.text().trim());
        }

        if (fullDescription.length() > 0)
            p.setDescription(fullDescription.toString());
    }

    private void clickSastavTab(Page page) {
        try {
            var tabButton = page.locator("button.e-n-tab-title:has-text('Sastav')");
            if (tabButton.count() > 0) {
                tabButton.first().click();
                page.waitForTimeout(800);
                log.info("[{}] Clicked Sastav tab", STORE_NAME);
            } else {
                log.warn("[{}] Sastav tab not found", STORE_NAME);
            }
        } catch (Exception e) {
            log.warn("[{}] Could not click Sastav tab: {}", STORE_NAME, e.getMessage());
        }
    }

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));
                page.waitForTimeout(300 + (long)(Math.random() * 500));
                return true;
            } catch (Exception e) {
                log.warn("[{}] Navigate retry {}/{} for {}: {}", STORE_NAME, i + 1, maxRetries, url, e.getMessage());
                try { Thread.sleep(3000L * (i + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            }
        }
        return false;
    }

    private boolean isBlocked(Page page) {
        try {
            String title = page.title();
            return title.contains("Cloudflare") || title.contains("Attention Required")
                    || title.contains("Just a moment") || title.contains("Access denied");
        } catch (Exception e) { return false; }
    }

    private Product parseElement(Element el) {
        try {
            Product p = new Product();
            Element title = el.selectFirst("h3.woocommerce-loop-product__title");
            p.setName(title != null ? title.text().trim() : "");
            Element link = el.selectFirst("a.woocommerce-LoopProduct-link");
            p.setUrl(link != null ? link.attr("href") : "");
            Element img = el.selectFirst("img");
            if (img != null) {
                String imgUrl = img.attr("src");
                if (imgUrl.isEmpty() || imgUrl.startsWith("data:")) imgUrl = img.attr("data-src");
                p.setImageUrl(imgUrl);
            } else {
                p.setImageUrl("");
            }
            Element priceEl = el.selectFirst("span.woocommerce-Price-amount bdi");
            if (priceEl != null)
                p.setPrice(priceEl.text().replace("\u00a0", "").replace("RSD", "").trim());
            extractPackageWeightFromName(p);
            extractBrandFromName(p);
            return p;
        } catch (Exception e) {
            return null;
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null) return;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE).matcher(p.getName());
        while (m.find()) {
            String w = m.group().trim();
            if (!p.getPackage_weight().contains(w)) p.getPackage_weight().add(w);
        }
    }

    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        String[] parts = p.getName().split("\\s+[-–]\\s+");
        if (parts.length >= 2) p.setBrand(parts[parts.length - 1].trim());
    }
}