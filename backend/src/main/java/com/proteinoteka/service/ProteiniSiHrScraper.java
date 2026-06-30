package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.HtmlCleaner;
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

// proteini.si is a custom PHP e-commerce platform (not WooCommerce).
// Product listing: a.product-box, itemprop=name, itemprop=price, img.list_image
// Detail pages are server-rendered — JSoup via httpClient, no Playwright needed.
@Slf4j
@Component
@RequiredArgsConstructor
public class ProteiniSiHrScraper implements StoreScraper {

    private final BaseScraperEnricher baseEnricher;
    private final NutritionParserService nutritionParser;
    private final ProxyAwareHttpClient httpClient;

    private static final String STORE_NAME = "Proteini.si HR";
    private static final String BASE_URL = "https://www.proteini.si/hr/proteini/";
    private static final String SITE_ORIGIN = "https://www.proteini.si";
    private static final int PRODUCTS_PER_PAGE = 20;

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl()   { return BASE_URL; }
    @Override public String getMarket()    { return "hr"; }
    @Override public String getCurrency()  { return "EUR"; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.select("a.product-box").size() >= PRODUCTS_PER_PAGE;
    }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("a.product-box");
        log.info("[{}] Found {} product elements on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            if (el.hasClass("block-disabled")) continue;  // out of stock
            Product p = parseElement(el);
            if (p != null) products.add(p);
        }

        enrichWithDetails(products, skipUrls);
        return products;
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element el) {
        try {
            String href = el.attr("href");
            if (href.isBlank()) return null;

            Element nameEl = el.selectFirst("[itemprop=name]");
            if (nameEl == null) return null;
            String name = nameEl.text().trim();
            if (name.isBlank()) return null;

            Product p = new Product();
            p.setName(name);
            p.setUrl(SITE_ORIGIN + href);

            // Display price like "28,53 €" — PriceParser handles comma-decimal
            Element priceEl = el.selectFirst("[itemprop=price]");
            if (priceEl != null) {
                p.setPrice(priceEl.text().replace("€", "").replace(" ", "").trim());
            }

            Element img = el.selectFirst("img.list_image");
            if (img != null) {
                String src = img.attr("src");
                if (!src.isBlank()) p.setImageUrl(SITE_ORIGIN + src);
            }

            Element brandEl = el.selectFirst("span.cat");
            if (brandEl != null && !brandEl.text().isBlank()) {
                p.setBrand(brandEl.text().trim());
            }

            extractPackageWeightFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null) return;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE)
                .matcher(p.getName());
        while (m.find()) {
            String w = m.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(w)) p.getPackage_weight().add(w);
        }
    }

    // -------------------- Detail page enrichment (JSoup only, no Playwright) --------------------

    private void enrichWithDetails(List<Product> products, Set<String> skipUrls) {
        int count = 0;
        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, p.getName());
                continue;
            }
            if (skipUrls.contains(p.getUrl())) {
                log.debug("[{}] Skipping '{}' — nutrition already complete", STORE_NAME, p.getName());
                continue;
            }

            try {
                long sleep = 3000 + ThreadLocalRandom.current().nextLong(4000);
                log.info("[{}] Sleeping {}s before '{}'...", STORE_NAME, sleep / 1000, p.getName());
                Thread.sleep(sleep);

                Document doc = fetchDetailPage(p.getUrl());
                if (doc == null) continue;

                enrichFlavours(doc, p);
                enrichDescription(doc, p);
                enrichNutrition(doc, p);

                log.info("[{}] Enriched '{}' -> flavours={}, protein={}, fat={}, sugar={}, cal={}",
                        STORE_NAME, p.getName(), p.getFlavours().size(),
                        p.getProteinPer100g(), p.getFatPer100g(),
                        p.getSugarPer100g(), p.getCaloriePer100g());

                count++;
                if (count % 10 == 0) {
                    long batchSleep = 30000 + ThreadLocalRandom.current().nextLong(15000);
                    log.info("[{}] Batch pause after {} products: {}s...", STORE_NAME, count, batchSleep / 1000);
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich '{}': {}", STORE_NAME, p.getName(), e.getMessage());
                safeSleep(5000);
            }
        }
    }

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                return httpClient.connection(url).get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/3 failed for {}: {}", STORE_NAME, attempt, url, e.getMessage());
                safeSleep(2000L * attempt);
            }
        }
        log.error("[{}] Failed to fetch {} after 3 attempts", STORE_NAME, url);
        return null;
    }

    // -------------------- Nutrition extraction --------------------

    private void enrichNutrition(Document doc, Product p) {
        extractNutritionFromTable(doc, p);

        if (p.getProteinPer100g() == null) {
            log.warn("[{}] '{}' — protein not found in table", STORE_NAME, p.getName());
        }

        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        try {
            for (Element table : doc.select("table")) {
                String text = table.text().toLowerCase();
                if (!text.contains("bjelančevine") && !text.contains("proteini")
                        && !text.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // Header: [Sastojci, doza, PU%*, 100 g] — find the "100 g" column
                int col100g = -1;
                for (Element row : rows) {
                    Elements cells = row.select("td, th");
                    for (int i = 0; i < cells.size(); i++) {
                        String ct = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                        if (ct.contains("100g") || ct.equals("100") ) {
                            col100g = i;
                            break;
                        }
                    }
                    if (col100g >= 0) break;
                }
                if (col100g < 0) continue;

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= col100g) continue;

                    String label = cells.get(0).text()
                            .replace(" ", " ")
                            .replaceAll("\\*+", "")
                            .trim().toLowerCase();

                    // Energy: "1623 kJ/387 kcal" — extract kcal
                    if (label.contains("energetska") || label.contains("energ")) {
                        String raw = cells.get(col100g).text();
                        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(raw);
                        if (m.find()) {
                            try { p.setCaloriePer100g(Double.parseDouble(m.group(1).replace(",", "."))); }
                            catch (Exception ignored) {}
                        }
                        continue;
                    }

                    String rawVal = cells.get(col100g).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();
                    if (rawVal.isBlank()) continue;

                    double val;
                    try { val = Double.parseDouble(rawVal); }
                    catch (Exception e) { continue; }
                    if (val < 0 || val > 10000) continue;

                    // Protein — "bjelančevine" (Croatian) or "proteini"
                    if ((label.equals("bjelančevine") || label.equals("proteini") || label.equals("protein"))
                            && val > 0 && val <= 95) {
                        p.setProteinPer100g(val);
                    }
                    // Fat — "masti" only, skip "zasićene" sub-row
                    else if (label.equals("masti") && val <= 100) {
                        p.setFatPer100g(val);
                    }
                    // Sugar — "od kojih šećeri"
                    else if ((label.contains("šećeri") || label.contains("šeceri") || label.contains("sugars"))
                            && val <= 100) {
                        p.setSugarPer100g(val);
                    }
                }

                if (p.getProteinPer100g() != null) break;
            }
        } catch (Exception e) {
            log.warn("[{}] Nutrition extraction failed: {}", STORE_NAME, e.getMessage());
        }
    }

    // -------------------- Flavour & description enrichment --------------------

    private void enrichFlavours(Document doc, Product p) {
        try {
            // Flavour buttons: <button data-val="18" ...>Banana</button>
            Elements buttons = doc.select("button[data-val]");
            for (Element btn : buttons) {
                String flavour = btn.text().trim();
                if (!flavour.isBlank() && !flavour.equals("Odaberite okus")
                        && !p.getFlavours().contains(flavour)) {
                    p.getFlavours().add(flavour);
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Flavour extraction failed for '{}': {}", STORE_NAME, p.getName(), e.getMessage());
        }
    }

    private void enrichDescription(Document doc, Product p) {
        try {
            // Try itemprop=description first
            Element descEl = doc.selectFirst("[itemprop=description]");
            if (descEl == null) descEl = doc.selectFirst(".product-description");
            if (descEl == null) descEl = doc.selectFirst(".desc_long");

            if (descEl != null) {
                String cleaned = HtmlCleaner.cleanDescription(descEl.html());
                if (!cleaned.isBlank()) {
                    p.setDescription(cleaned);
                    return;
                }
            }

            // Fallback: text content after the nutrition table
            Elements tables = doc.select("table");
            if (!tables.isEmpty()) {
                Element lastTable = tables.last();
                Element next = lastTable.nextElementSibling();
                if (next != null && !next.text().isBlank()) {
                    p.setDescription(HtmlCleaner.cleanDescription(next.html()));
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Description extraction failed for '{}': {}", STORE_NAME, p.getName(), e.getMessage());
        }
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
