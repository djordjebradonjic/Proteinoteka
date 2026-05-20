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
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class OgistraScraper implements StoreScraper {

    private static final String STORE_NAME = "Ogistrashop";
    private static final String BASE_URL = "https://www.ogistra-nutrition-shop.com/12-proteini";

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;

    @Override
    public String getStoreName() { return STORE_NAME; }

    @Override
    public String getBaseUrl() { return BASE_URL; }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        Element next = doc.selectFirst("a[rel=next]");
        if (next != null) return true;
        next = doc.selectFirst("li.next:not(.disabled) a");
        if (next != null) return true;
        return doc.selectFirst("a.next.js-search-link") != null;
    }

    @Override
    public boolean usePlaywrightForListing() {
        return false;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("article.product-miniature");
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

            Element titleLink = el.selectFirst("h3 a.product_name");
            if (titleLink == null) titleLink = el.selectFirst("h3 a");
            if (titleLink == null) return null;

            p.setName(titleLink.text().trim());
            String url = titleLink.attr("href");
            if (url.contains("#")) url = url.substring(0, url.indexOf("#"));
            p.setUrl(url);

            Element img = el.selectFirst("img.first-image");
            if (img != null) {
                String imgUrl = img.attr("data-src");
                if (imgUrl.isBlank()) imgUrl = img.attr("src");
                if (imgUrl.contains("home_default"))
                    imgUrl = imgUrl.replace("home_default", "large_default");
                p.setImageUrl(imgUrl);
            }

            Element priceEl = el.selectFirst("span.price");
            if (priceEl != null) {
                String price = priceEl.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim();
                p.setPrice(price);
                try {
                    double numericPrice = Double.parseDouble(
                            price.replace(".", "").replace(",", ".").replaceAll("[^0-9.]", "")
                    );
                    if (numericPrice < 500) {
                        log.debug("[{}] Skipping '{}' - price {}RSD < 500RSD", STORE_NAME, p.getName(), numericPrice);
                        return null;
                    }
                } catch (Exception e) {
                    log.warn("[{}] Failed to parse price for filtering: '{}'", STORE_NAME, price);
                }
            }

            extractBrandFromName(p);
            extractPackageWeightFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        String[] parts = p.getName().split("\\s+[–-]\\s+");
        if (parts.length >= 2) {
            String brand = parts[parts.length - 1].trim();
            if (!brand.isBlank()) p.setBrand(brand);
        }
        if (p.getBrand() == null && p.getName().toUpperCase().contains("THE "))
            p.setBrand("THE Nutrition");
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
                Thread.sleep(ThreadLocalRandom.current().nextLong(6000, 12000));

                if (!navigateWithRetry(page, p.getUrl(), 3)) {
                    log.error("[{}] Failed to load {} after retries, skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                String title = page.title();
                if (title.contains("Cloudflare") || title.contains("Attention Required")
                        || title.contains("Just a moment")) {
                    log.error("[{}] FIREWALL DETECTED! Stopping.", STORE_NAME);
                    return;
                }

                page.waitForTimeout(500 + (int)(Math.random() * 1000));

                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichFlavours(doc, p);
                enrichDescription(doc, p);
                enrichNutrition(doc, p);

                log.info("[{}] Enriched '{}' -> brand={}, protein={}, fat={}, sugar={}, cal={}",
                        STORE_NAME, p.getName(), p.getBrand(),
                        p.getProteinPer100g(), p.getFatPer100g(),
                        p.getSugarPer100g(), p.getCaloriePer100g());

                count++;
                if (count % 15 == 0) {
                    long longSleep = ThreadLocalRandom.current().nextLong(40000, 60000);
                    log.info("[{}] Batch of 15 done, sleeping {}s...", STORE_NAME, longSleep / 1000);
                    try { page.navigate("about:blank"); } catch (Exception ignored) {}
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
        if (p.getProteinPer100g() == null) {
            String allText = "";
            Element fullDesc = doc.selectFirst("div#description");
            if (fullDesc != null) allText = fullDesc.text();
            if (allText.isBlank() && p.getDescription() != null) allText = p.getDescription();

            if (!allText.isBlank()) {
                Double protein = nutritionParser.extractProteinPer100g(allText);
                if (protein != null) p.setProteinPer100g(protein);
            }
            baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);

        }

        log.info("[{}] '{}' -> protein: {}, sugar: {}, fat: {}, cal: {}",
                STORE_NAME, p.getName(),
                p.getProteinPer100g(), p.getSugarPer100g(),
                p.getFatPer100g(), p.getCaloriePer100g());
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        Elements tables = doc.select("table");

        for (Element table : tables) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini") && !tableText.contains("belančevine")
                    && !tableText.contains("protein")) continue;

            try {
                // Try to find serving size for per-serving tables
                Double servingSizeGrams = findServingSize(table);

                if (servingSizeGrams != null) {
                    // Per-serving table — calculate per 100g
                    extractNutritionFromServingTable(table, p, servingSizeGrams);
                } else {
                    // Standard table with 100g column
                    extractNutritionFromStandardTable(table, p);
                }

                if (p.getProteinPer100g() != null) break;

            } catch (Exception e) {
                log.warn("[{}] Failed to parse table: {}", STORE_NAME, e.getMessage());
            }
        }
    }

    private void extractNutritionFromServingTable(Element table, Product p, double servingSizeGrams) {
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

            double per100g = (value / servingSizeGrams) * 100.0;
            double rounded = Math.round(per100g * 10) / 10.0;

            // Protein
            if ((label.contains("proteini") || label.contains("belančevine") || label.equals("protein"))
                    && !label.contains("koncentrat") && !label.contains("izvor") && !label.contains("preparat")) {
                if (rounded > 0 && rounded <= 95) p.setProteinPer100g(rounded);
            }
            // Fat
            else if (label.contains("masti") || label.contains("ukupne masti") || label.equals("fat")) {
                if (rounded <= 100) p.setFatPer100g(rounded);
            }
            // Sugar
            else if (label.contains("šećeri") || label.contains("seceri") || label.contains("sugar")
                    || (label.contains("ugljeni hidrati") && label.contains("šećer"))) {
                if (rounded <= 100) p.setSugarPer100g(rounded);
            }
            // Calories
            else if (label.contains("energetska") || label.contains("kalorij")
                    || label.contains("kcal") || label.contains("energy")) {
                // For calories don't scale — use raw value as approx per serving
                p.setCaloriePer100g((value / servingSizeGrams) * 100.0);
            }
        }
    }

    private void extractNutritionFromStandardTable(Element table, Product p) {
        Elements rows = table.select("tr");
        if (rows.isEmpty()) return;

        // Detect 100g column
        int per100gCol = -1;
        Elements headerCells = rows.get(0).select("th, td");
        for (int i = 0; i < headerCells.size(); i++) {
            String cellText = headerCells.get(i).text().toLowerCase().replaceAll("\\s+", "");
            if (cellText.contains("100g") || cellText.contains("100gr")) {
                per100gCol = i;
                break;
            }
        }
        if (per100gCol < 1) return;

        for (Element row : rows) {
            Elements cells = row.select("td");
            if (cells.size() <= per100gCol) continue;

            String label = cells.get(0).text().trim().toLowerCase();
            String rawValue = cells.get(per100gCol).text()
                    .replaceAll("[^0-9,.]", "").replace(",", ".").trim();

            if (rawValue.isBlank()) continue;

            double value;
            try {
                value = Double.parseDouble(rawValue);
            } catch (Exception e) {
                continue;
            }

            if (value < 0 || value > 1000) continue;

            // Protein
            if ((label.contains("proteini") || label.contains("belančevine"))
                    && !label.contains("koncentrat") && !label.contains("izvor")) {
                if (value > 0 && value <= 95) p.setProteinPer100g(value);
            }
            // Fat
            else if (label.contains("masti") || label.contains("ukupne masti") || label.equals("fat")) {
                if (value <= 100) p.setFatPer100g(value);
            }
            // Sugar
            else if (label.contains("šećeri") || label.contains("seceri") || label.contains("sugar")
                    || (label.contains("ugljeni hidrati") && label.contains("šećer"))) {
                if (value <= 100) p.setSugarPer100g(value);
            }
            // Calories
            else if (label.contains("energetska") || label.contains("kalorij")
                    || label.contains("kcal") || label.contains("energy")) {
                String rawCell = cells.get(1).text();
                // Extract kcal value specifically
                java.util.regex.Matcher kcalM = java.util.regex.Pattern
                        .compile("(\\d+[.,]?\\d*)\\s*kcal", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(rawCell);
                if (kcalM.find()) {
                    try {
                        double kcal = Double.parseDouble(kcalM.group(1).replace(",", "."));
                        double per100g = Math.round((kcal / 28 * 100) * 10.0) / 10.0;
                        p.setCaloriePer100g(per100g);
                    } catch (Exception ignored) {
                    }
                }
            }
        }
    }

    private Double findServingSize(Element table) {
        // Check heading above table — Ogistra format: "Nutritivne vrednosti po porciji (28 g)"
        Element el = table.previousElementSibling();
        while (el != null) {
            Double size = extractServingSize(el.text());
            if (size != null) return size;
            el = el.previousElementSibling();
        }

        // Check h2/h3 anywhere in description that mentions porcija
        Element desc = table.parent();
        while (desc != null) {
            for (Element heading : desc.select("h2, h3")) {
                Double size = extractServingSize(heading.text());
                if (size != null) return size;
            }
            desc = desc.parent();
            if (desc != null && desc.tagName().equals("body")) break;
        }

        Element caption = table.selectFirst("caption");
        if (caption != null) {
            Double size = extractServingSize(caption.text());
            if (size != null) return size;
        }

        Element thead = table.selectFirst("thead");
        if (thead != null) return extractServingSize(thead.text());

        return null;
    }

    private Double extractServingSize(String text) {
        if (text == null) return null;

        Pattern pattern = Pattern.compile(
                "\\(\\s*(\\d+[.,]?\\d*)\\s*g\\s*\\)|" +       // (28 g)
                        "porcij[ia]\\s*\\(?(\\d+[.,]?\\d*)\\s*g|" +   // porciji (28 g) ili porciji 28 g
                        "po\\s+porciji\\s*\\(?(\\d+[.,]?\\d*)\\s*g|"+ // po porciji (28 g)
                        "serving.*?(\\d+[.,]?\\d*)\\s*g",              // serving 28 g
                Pattern.CASE_INSENSITIVE
        );

        Matcher m = pattern.matcher(text);
        if (m.find()) {
            for (int i = 1; i <= m.groupCount(); i++) {
                String match = m.group(i);
                if (match != null && !match.isBlank()) {
                    try { return Double.parseDouble(match.replace(",", ".")); }
                    catch (Exception ignored) {}
                }
            }
        }
        return null;
    }

    // -------------------- Other enrichment --------------------

    private void enrichBrand(Document doc, Product p) {
        Element brandSchema = doc.selectFirst("[itemprop=brand]");
        if (brandSchema != null && !brandSchema.text().isBlank()) {
            p.setBrand(brandSchema.text().trim());
            return;
        }
        Element mfgLink = doc.selectFirst("div.product-manufacturer a");
        if (mfgLink != null && !mfgLink.text().isBlank()) {
            p.setBrand(mfgLink.text().trim());
            return;
        }
        Element mfgImg = doc.selectFirst("div.product-manufacturer img");
        if (mfgImg != null && !mfgImg.attr("alt").isBlank()) {
            p.setBrand(mfgImg.attr("alt").trim());
            return;
        }
        Element meta = doc.selectFirst("meta[property=product:brand]");
        if (meta != null && !meta.attr("content").isBlank())
            p.setBrand(meta.attr("content").trim());
    }

    private void enrichFlavours(Document doc, Product p) {
        Element variantsDiv = doc.selectFirst("div.product-variants");
        if (variantsDiv != null) {
            for (Element label : variantsDiv.select("span.control-label")) {
                if (label.text().toLowerCase().contains("ukus") || label.text().toLowerCase().contains("flavor")) {
                    Element parent = label.parent();
                    if (parent != null) {
                        for (Element radioLabel : parent.select("span.radio-label")) {
                            String flavour = radioLabel.text().trim();
                            if (!flavour.isBlank() && !p.getFlavours().contains(flavour))
                                p.getFlavours().add(flavour);
                        }
                    }
                    return;
                }
            }
        }

        for (Element input : doc.select("input.input-radio[type=radio]")) {
            String title = input.attr("title").trim();
            if (!title.isBlank() && !p.getFlavours().contains(title))
                p.getFlavours().add(title);
        }
    }

    private void enrichDescription(Document doc, Product p) {
        // Ogistra full description tab
        Element fullDesc = doc.selectFirst("div#description div.product-description");
        if (fullDesc != null && !fullDesc.text().isBlank()) {
            p.setDescription(fullDesc.text().trim());
            return;
        }
        Element shortDesc = doc.selectFirst("div.product-description-short");
        if (shortDesc != null && !shortDesc.text().isBlank())
            p.setDescription(shortDesc.text().trim());
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

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}