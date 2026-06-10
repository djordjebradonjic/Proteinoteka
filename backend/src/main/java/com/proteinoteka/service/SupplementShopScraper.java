package com.proteinoteka.service;

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
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class SupplementShopScraper implements StoreScraper {

    private static final String STORE_NAME = "Supplementshop";
    private static final String BASE_URL = "https://supplementshop.rs/kategorija-proizvoda/proteini/";

    private static final Map<String, String> FLAVOUR_MAP = Map.ofEntries(
            Map.entry("Chocolate", "Čokolada"),
            Map.entry("Cokolada", "Čokolada"),
            Map.entry("Belgian Chocolate", "Belgijska čokolada"),
            Map.entry("Double Chocolate", "Dupla čokolada"),
            Map.entry("Milk Choc Hazelnut", "Mlečna čokolada - lešnik"),
            Map.entry("Dark Choc Mocha", "Tamna čokolada - kafa"),
            Map.entry("Dark Choc Raspberry", "Tamna čokolada - malina"),
            Map.entry("Rich Chocolate Flavour", "Čokolada"),
            Map.entry("Chocolate Brownie", "Čokoladni brauni"),
            Map.entry("Chocolate Cookie", "Čokolada kolačić"),
            Map.entry("Chocolate Mint", "Čokolada - menta"),
            Map.entry("Chocolate Orange Deluxe", "Čokolada - pomorandža"),
            Map.entry("Chocolate Peanut", "Čokolada - kikiriki"),
            Map.entry("Chocolate Perfection", "Čokolada"),
            Map.entry("Choco Peanut Brownie", "Čokolada - kikiriki brauni"),
            Map.entry("Choc Peanut Butter", "Čokolada - kikiriki puter"),
            Map.entry("White Choc Blondie", "Bela čokolada"),
            Map.entry("White Chocolate Deluxe", "Bela čokolada"),
            Map.entry("Raspberry & White Chocolate", "Malina - bela čokolada"),
            Map.entry("Vanilla", "Vanila"),
            Map.entry("Vanilla Bean", "Vanila"),
            Map.entry("Vanilla Creme", "Vanila krem"),
            Map.entry("Vanilla Ice Cream", "Vanila sladoled"),
            Map.entry("Creamy Vanilla", "Vanila"),
            Map.entry("Strawberry", "Jagoda"),
            Map.entry("Strawberry Delight", "Jagoda"),
            Map.entry("Strawberries & Cream", "Jagoda krem"),
            Map.entry("Strawberries Creme", "Jagoda krem"),
            Map.entry("Salted Caramel", "Slana karamela"),
            Map.entry("Salted Fudge Brownie", "Slana karamela brauni"),
            Map.entry("Caramel Crunch", "Karamela"),
            Map.entry("Cacao & Caramel", "Kakao - karamela"),
            Map.entry("Peanut Butter Jelly", "Kikiriki puter - džem"),
            Map.entry("Cookies & Cream", "Kolačić i krem"),
            Map.entry("Birthday Cake", "Torta"),
            Map.entry("Cherry Bakewell", "Trešnja"),
            Map.entry("Banana", "Banana")
    );

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;


    @Override
    public String getStoreName() { return STORE_NAME; }

    @Override
    public String getBaseUrl() { return BASE_URL; }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("a.next.page-numbers") != null;
    }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "page/" + page + "/";
    }

    @Override
    public void waitForListing(Page page) {
        // WoodMart AJAX shop loads products asynchronously — wait for them to appear
        try {
            page.waitForSelector("div.wd-product",
                    new Page.WaitForSelectorOptions().setTimeout(12000));
            page.waitForTimeout(1000);
        } catch (Exception e) {
            log.warn("[{}] wd-product not found after 12s — page may still be loading: {}",
                    STORE_NAME, page.url());
        }
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("div.wd-product");
        log.info("[{}] Found {} products on listing page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) products.add(p);
            else log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
        }

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products);
        }

        return products;
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element el) {
        try {
            Product p = new Product();

            Element titleLink = el.selectFirst("h3.wd-entities-title a");
            if (titleLink == null) return null;
            p.setName(titleLink.text().trim());
            p.setUrl(titleLink.attr("href"));

            Element imgEl = el.selectFirst(".product-image-link img");
            if (imgEl != null) {
                String imgUrl = imgEl.attr("src");
                if (imgUrl.isEmpty() || imgUrl.startsWith("data:")) {
                    String srcset = imgEl.attr("srcset");
                    if (!srcset.isEmpty()) {
                        String[] parts = srcset.split(",");
                        imgUrl = parts[parts.length - 1].trim().split("\\s+")[0];
                    }
                }
                if (imgUrl.isEmpty() || imgUrl.startsWith("data:"))
                    imgUrl = imgEl.attr("data-src");
                p.setImageUrl(imgUrl);
            }

            Element priceEl = el.selectFirst("span.woocommerce-Price-amount bdi");
            if (priceEl != null) {
                p.setPrice(priceEl.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim());
            }

            Element brandCat = el.selectFirst("div.wd-product-cats a");
            if (brandCat != null) p.setBrand(brandCat.text().trim());

            Elements swatches = el.select("div.wd-swatches-grid span.wd-swatch-text");
            for (Element swatch : swatches) {
                String flavour = swatch.text().trim();
                if (!flavour.isBlank() && !p.getFlavours().contains(flavour))
                    p.getFlavours().add(flavour);
            }

            extractPackageWeightFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE).matcher(p.getName());
        while (m.find()) {
            String w = m.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(w)) p.getPackage_weight().add(w);
        }
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        int count = 0;
        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' - not a protein product", STORE_NAME, p.getName());
                continue;
            }


            try {
                Thread.sleep(ThreadLocalRandom.current().nextLong(4000, 7000));

                if (!navigateWithRetry(page, p.getUrl(), 3)) {
                    log.error("[{}] Failed to load {} after retries, skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                if (isBlocked(page)) {
                    log.error("[{}] DETECTED BY FIREWALL on {}! Stopping scraper.", STORE_NAME, p.getUrl());
                    return;
                }

                simulateHumanActivity(page);

                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichPackageWeights(doc, p);
                enrichFlavours(doc, p);
                enrichDescription(doc, p);
                enrichNutrition(doc, p);

                log.info("[{}] Enriched '{}' -> brand={}, protein={}, fat={}, sugar={}, cal={}",
                        STORE_NAME, p.getName(), p.getBrand(),
                        p.getProteinPer100g(), p.getFatPer100g(),
                        p.getSugarPer100g(), p.getCaloriePer100g());

                count++;

                if (count % 15 == 0) {
                    long longSleep = ThreadLocalRandom.current().nextLong(45000, 65000);
                    log.info("[{}] Batch of 15 done, sleeping {}s...", STORE_NAME, longSleep / 1000);
                    Thread.sleep(longSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}", STORE_NAME, p.getName(), e.getMessage());
                safeSleep(5000);
            }
        }
    }

    // -------------------- Nutrition extraction --------------------

    private void enrichNutrition(Document doc, Product p) {
        extractNutritionFromTable(doc, p);

        // Fallback for protein only
        if (p.getProteinPer100g() == null && p.getDescription() != null
                && !p.getDescription().isBlank()) {
            Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }

        if (p.getProteinPer100g() == null)
            log.warn("[{}] '{}' -> protein per 100g not found", STORE_NAME, p.getName());

        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);

        log.info("[{}] '{}' -> protein: {}, sugar: {}, fat: {}, cal: {}",
                STORE_NAME, p.getName(),
                p.getProteinPer100g(), p.getSugarPer100g(),
                p.getFatPer100g(), p.getCaloriePer100g());
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        // SupplementShop — tabela je u div.wd-text-block ili div#tab-description
        Element container = doc.selectFirst("div.wd-text-block");
        if (container == null) container = doc.selectFirst("div#tab-description");
        if (container == null) container = doc.selectFirst("div.woocommerce-Tabs-panel--description");
        if (container == null) return;

        Elements tables = container.select("table");
        if (tables.isEmpty()) return;

        for (Element table : tables) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini") && !tableText.contains("protein")
                    && !tableText.contains("belančevine")) continue;

            try {
                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // Detect 100g column
                // SupplementShop format: | Standardne vrednosti | Na 100g | Na 25g |
                int per100gCol = -1;
                Elements headerCells = rows.get(0).select("th, td");
                for (int i = 0; i < headerCells.size(); i++) {
                    String cellText = headerCells.get(i).text()
                            .toLowerCase().replaceAll("\\s+", "");
                    if (cellText.contains("100g") || cellText.contains("100gr")
                            || cellText.contains("na100")) {
                        per100gCol = i;
                        break;
                    }
                }

                if (per100gCol < 1) continue;

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase()
                            .replaceAll("\\*", "").trim();

                    String rawValue = cells.get(per100gCol).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();

                    if (rawValue.isBlank()) continue;

                    double value;
                    try { value = Double.parseDouble(rawValue); }
                    catch (Exception e) { continue; }

                    if (value < 0 || value > 10000) continue;

                    // Protein
                    if ((label.equals("proteini") || label.contains("belančevine"))
                            && !label.contains("koncentrat") && !label.contains("preparat")
                            && !label.contains("izvor")) {
                        if (value > 0 && value <= 95) p.setProteinPer100g(value);
                    }
                    // Fat — samo "Masti", ne zasićene
                    else if ((label.equals("masti") || label.equals("fat"))
                            && !label.contains("zasić") && !label.contains("toga")
                            && !label.contains("kojih")) {
                        if (value <= 100) p.setFatPer100g(value);
                    }
                    // Sugar
                    else if (label.contains("šećeri") || label.contains("seceri")
                            || label.contains("sugar")) {
                        if (value <= 100) p.setSugarPer100g(value);
                    }
                    // Calories — "1647kJ / 383kcal" format
                    else if (label.contains("energi") || label.contains("kalorij")
                            || label.contains("kcal")) {
                        String rawCell = cells.get(per100gCol).text();
                        java.util.regex.Matcher m = java.util.regex.Pattern
                                .compile("(\\d+[.,]?\\d*)\\s*kcal",
                                        java.util.regex.Pattern.CASE_INSENSITIVE)
                                .matcher(rawCell);
                        if (m.find()) {
                            try {
                                p.setCaloriePer100g(Double.parseDouble(
                                        m.group(1).replace(",", ".")));
                            } catch (Exception ignored) {}
                        }
                    }
                }

                if (p.getProteinPer100g() != null) break;

            } catch (Exception e) {
                log.warn("[{}] Failed to parse table: {}", STORE_NAME, e.getMessage());
            }
        }
    }

    // -------------------- Other enrichment --------------------

    private void enrichBrand(Document doc, Product p) {
        Element brandImg = doc.selectFirst("div.wd-product-brands img");
        if (brandImg != null && !brandImg.attr("alt").isBlank()) {
            p.setBrand(brandImg.attr("alt").trim());
            return;
        }

        Element brandLink = doc.selectFirst("div.wd-product-brands a");
        if (brandLink != null) {
            String href = brandLink.attr("href");
            if (href.contains("filter_brand=")) {
                String slug = href.substring(href.indexOf("filter_brand=") + 13)
                        .replace("-", " ").trim();
                if (!slug.isBlank()) {
                    StringBuilder brand = new StringBuilder();
                    for (String word : slug.split("\\s+")) {
                        if (!word.isEmpty())
                            brand.append(Character.toUpperCase(word.charAt(0)))
                                    .append(word.substring(1)).append(" ");
                    }
                    p.setBrand(brand.toString().trim());
                }
            }
        }
    }

    private void enrichPackageWeights(Document doc, Product p) {
        Elements options = doc.select("select[name=attribute_pa_pakovanje] option");
        List<String> weights = new ArrayList<>();
        for (Element opt : options) {
            if (opt.attr("value").isBlank()) continue;
            String weight = opt.text().trim().replaceAll("\\s+", "");
            if (!weight.isBlank() && !weights.contains(weight)) weights.add(weight);
        }

        if (weights.isEmpty()) {
            Element packRow = doc.selectFirst(
                    "tr.woocommerce-product-attributes-item--attribute_pa_pakovanje td");
            if (packRow != null) {
                for (Element term : packRow.select("span.wd-attr-term p")) {
                    String weight = term.text().trim().replaceAll("\\s+", "");
                    if (!weight.isBlank() && !weights.contains(weight)) weights.add(weight);
                }
            }
        }

        if (!weights.isEmpty()) {
            p.getPackage_weight().clear();
            p.getPackage_weight().addAll(weights);
        }
    }

    private void enrichFlavours(Document doc, Product p) {
        Elements options = doc.select("select[name=attribute_pa_ukus] option");
        boolean found = false;
        for (Element opt : options) {
            if (opt.attr("value").isBlank()) continue;
            String flavour = normalizeFlavour(opt.text().trim());
            if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                p.getFlavours().add(flavour);
                found = true;
            }
        }

        if (!found) {
            Element flavRow = doc.selectFirst(
                    "tr.woocommerce-product-attributes-item--attribute_pa_ukus td");
            if (flavRow != null) {
                for (Element term : flavRow.select("span.wd-attr-term p")) {
                    String flavour = normalizeFlavour(term.text().trim());
                    if (!flavour.isBlank() && !p.getFlavours().contains(flavour))
                        p.getFlavours().add(flavour);
                }
            }
        }
    }

    private String normalizeFlavour(String raw) {
        return FLAVOUR_MAP.getOrDefault(raw, raw);
    }

    private void enrichDescription(Document doc, Product p) {
        // SupplementShop full description with nutrition table
        Element fullDesc = doc.selectFirst("div.wd-text-block");
        if (fullDesc != null && !fullDesc.text().isBlank()) {
            p.setDescription(fullDesc.text().trim());
            return;
        }

        // Fallback - short description
        Element shortDesc = doc.selectFirst("div.woocommerce-product-details__short-description");
        if (shortDesc != null && !shortDesc.text().isBlank())
            p.setDescription(shortDesc.text().trim());
    }

    // -------------------- Helpers --------------------

    private boolean isBlocked(Page page) {
        String title = page.title();
        return title.contains("Cloudflare") || title.contains("Attention Required")
                || title.contains("Just a moment");
    }

    private void simulateHumanActivity(Page page) {
        try {
            page.mouse().wheel(0, ThreadLocalRandom.current().nextInt(300, 600));
            page.waitForTimeout(ThreadLocalRandom.current().nextInt(1000, 2000));
        } catch (Exception ignored) {}
    }

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(30000));
                page.waitForTimeout(300 + (long)(Math.random() * 500));
                return true;
            } catch (Exception e) {
                log.warn("[{}] Navigate retry {}/{} for {}: {}", STORE_NAME, i + 1, maxRetries, url, e.getMessage());
                try { Thread.sleep(3000L * (i + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            }
        }
        return false;
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}