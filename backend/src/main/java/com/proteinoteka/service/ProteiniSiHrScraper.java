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
// Listing: a.product-box | Detail pages: server-rendered, JSoup only — no Playwright needed.
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

    // URL path segments that indicate non-supplement product categories
    private static final Set<String> SKIP_URL_SEGMENTS = Set.of(
            "/grickalice/", "/namazi/", "/gotovi-napitci/", "/pudinzi/", "/muesli/"
    );

    // Name/URL fragments that indicate bundle kits (no meaningful per-unit nutrition)
    private static final Pattern BUNDLE_PATTERN = Pattern.compile(
            "-bundle|-duo\\b|-starter\\b|-recovery-pro\\b|-mass-up\\b|-fit-start\\b",
            Pattern.CASE_INSENSITIVE
    );

    // "24x35g" → total 840g; "12x30g" → total 360g
    private static final Pattern MULTIPACK_PATTERN =
            Pattern.compile("(\\d+)[xX×](\\d+[.,]?\\d*)\\s*(kg|g)", Pattern.CASE_INSENSITIVE);

    // "48 doza" with no gram weight — resolved from nutrition table serving size
    private static final Pattern DOZA_PATTERN = Pattern.compile("(\\d+)\\s*doza", Pattern.CASE_INSENSITIVE);

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
            if (el.hasClass("block-disabled")) continue;
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

            // Skip non-supplement categories and bundle kits
            if (isSkippedUrl(href)) {
                log.debug("[{}] Skipping non-supplement URL: {}", STORE_NAME, href);
                return null;
            }

            Element nameEl = el.selectFirst("[itemprop=name]");
            if (nameEl == null) return null;
            String name = nameEl.text().trim();
            if (name.isBlank()) return null;

            Product p = new Product();
            p.setName(name);
            p.setUrl(SITE_ORIGIN + href);

            Element priceEl = el.selectFirst("[itemprop=price]");
            if (priceEl != null) {
                // Display text "28,53 €" — strip € and non-breaking spaces
                p.setPrice(priceEl.text().replace("€", "").replace(" ", "").replace(" ", "").trim());
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

    private boolean isSkippedUrl(String href) {
        for (String seg : SKIP_URL_SEGMENTS) {
            if (href.contains(seg)) return true;
        }
        return BUNDLE_PATTERN.matcher(href).find();
    }

    // Handles three weight formats found on this store:
    //   "24x35g"  → 840g total
    //   "1800g"   → 1800g
    //   "2.27kg"  → 2270g
    // "48 doza" products have no gram weight in the name — handled later from nutrition table.
    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null) return;
        String name = p.getName();

        // Multi-pack: "24x35g" → 24 × 35 = 840g
        Matcher mp = MULTIPACK_PATTERN.matcher(name);
        if (mp.find()) {
            try {
                double count = Double.parseDouble(mp.group(1));
                double unit = Double.parseDouble(mp.group(2).replace(",", "."));
                boolean isKg = mp.group(3).equalsIgnoreCase("kg");
                double total = count * unit * (isKg ? 1000 : 1);
                String label = total % 1000 == 0
                        ? ((int)(total / 1000)) + "kg"
                        : ((int) total) + "g";
                if (!p.getPackage_weight().contains(label)) p.getPackage_weight().add(label);
                return;
            } catch (Exception ignored) {}
        }

        // Single weight: "1800g", "2.27kg"
        Matcher ms = Pattern.compile("(\\d+[.,]?\\d*)\\s*(kg|g)\\b", Pattern.CASE_INSENSITIVE).matcher(name);
        while (ms.find()) {
            String w = ms.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(w)) p.getPackage_weight().add(w);
        }
    }

    // -------------------- Detail page enrichment (JSoup only) --------------------

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

                // Resolve "48 doza" weight from nutrition table serving size
                if (p.getPackage_weight().isEmpty()) {
                    resolveDozeWeight(p);
                }

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

    // "48 doza" with doza size from nutrition table header (e.g. "doza (39 g)") → 48 × 39 = 1872g
    private void resolveDozeWeight(Product p) {
        Matcher dm = DOZA_PATTERN.matcher(p.getName());
        if (!dm.find()) return;
        int doseCount = Integer.parseInt(dm.group(1));

        // dozaServingGrams is set during nutrition extraction from the header cell
        if (p.getPrimaryWeightGrams() != null && p.getPrimaryWeightGrams() > 0) return;

        // Try to read the doza size stored temporarily in package_weight during nutrition parsing
        for (String w : p.getPackage_weight()) {
            if (w.endsWith("g_per_doza")) {
                try {
                    double gPerDoza = Double.parseDouble(w.replace("g_per_doza", ""));
                    double total = doseCount * gPerDoza;
                    p.getPackage_weight().clear();
                    String label = total % 1000 == 0 ? ((int)(total/1000)) + "kg" : ((int) total) + "g";
                    p.getPackage_weight().add(label);
                    log.info("[{}] '{}' weight resolved: {} doza × {}g = {}g",
                            STORE_NAME, p.getName(), doseCount, (int) gPerDoza, (int) total);
                } catch (Exception ignored) {}
                break;
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
            // Nutrition section: #product-sec-hranilne-vrednosti
            Element nutSection = doc.selectFirst("#product-sec-hranilne-vrednosti");
            Elements tables = nutSection != null ? nutSection.select("table") : doc.select("table");

            for (Element table : tables) {
                String text = table.text().toLowerCase();
                if (!text.contains("bjelančevine") && !text.contains("proteini")
                        && !text.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // Header format: [label_col, "100 g", "doza (39 g) (%*)"]
                // OR: [&nbsp;, "100 g", "doza (39 g)(%*)"] — 100g is always col index 1 here
                int col100g = -1;
                double gPerDoza = 0;
                for (Element row : rows) {
                    Elements cells = row.select("td, th");
                    for (int i = 0; i < cells.size(); i++) {
                        String ct = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                        if (ct.contains("100g") || ct.equals("100")) {
                            col100g = i;
                        }
                        // Extract "doza (39 g)" serving size for "N doza" products
                        Matcher dm = Pattern.compile("doza\\s*\\(?(\\d+[.,]?\\d*)\\s*g\\)?").matcher(
                                cells.get(i).text().toLowerCase());
                        if (dm.find() && gPerDoza == 0) {
                            try { gPerDoza = Double.parseDouble(dm.group(1).replace(",", ".")); }
                            catch (Exception ignored) {}
                        }
                    }
                    if (col100g >= 0) break;
                }
                if (col100g < 0) continue;

                // Store doza size as temp marker for resolveDozeWeight()
                if (gPerDoza > 0 && p.getPackage_weight().isEmpty()) {
                    p.getPackage_weight().add((int) gPerDoza + "g_per_doza");
                }

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= col100g) continue;

                    String label = cells.get(0).text()
                            .replace(" ", " ")
                            .replaceAll("\\*+", "")
                            .trim().toLowerCase();

                    // Energy: "1623 kJ/387 kcal"
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

                    if ((label.equals("bjelančevine") || label.equals("proteini") || label.equals("protein"))
                            && val > 0 && val <= 95) {
                        p.setProteinPer100g(val);
                    } else if (label.equals("masti") && val <= 100) {
                        p.setFatPer100g(val);
                    } else if ((label.contains("šećeri") || label.contains("šeceri") || label.contains("sugars"))
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
            // Flavour picker: <button data-val="18">Banana</button>
            for (Element btn : doc.select("button[data-val]")) {
                String flavour = btn.text().trim();
                if (!flavour.isBlank() && !flavour.equalsIgnoreCase("Odaberite okus")
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
            // Description section: #product-sec-opis .c-content
            Element section = doc.selectFirst("#product-sec-opis .c-content");
            if (section != null) {
                String cleaned = HtmlCleaner.cleanDescription(section.html());
                if (!cleaned.isBlank()) {
                    p.setDescription(cleaned);
                    return;
                }
            }
            // Fallback: full #product-sec-opis div text
            Element opis = doc.selectFirst("#product-sec-opis");
            if (opis != null) {
                // Remove the h2/button "Opis" header
                Element h2 = opis.selectFirst("h2");
                if (h2 != null) h2.remove();
                String cleaned = HtmlCleaner.cleanDescription(opis.html());
                if (!cleaned.isBlank()) p.setDescription(cleaned);
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
