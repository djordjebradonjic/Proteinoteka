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
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("li.product");
        log.info("[{}] Found {} products on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) products.add(p);
            else log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
        }

        if (page != null) {
            enrichWithDetails(page, products);
        } else {
            log.info("[{}] Skipping enrichment (page is null)", STORE_NAME);
        }

        return products;
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff2}", route -> route.abort());

        if (page.title().contains("Cloudflare") || page.title().contains("Attention Required")) {
            log.error("[{}] DETECTED BY FIREWALL! Stopping scraper.", STORE_NAME);
            return;
        }

        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' - not a protein product", STORE_NAME, p.getName());
                continue;
            }


            try {
                page.navigate(p.getUrl(), new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED));

                page.waitForTimeout(500 + (long)(Math.random() * 1000));

                clickSastavTab(page);

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

                if (count % 20 == 0) {
                    log.info("[{}] Batch of 20 done, sleeping 40s...", STORE_NAME);
                    Thread.sleep(40_000);
                } else {
                    long sleepTime = 3000 + (long)(Math.random() * 4000);
                    Thread.sleep(sleepTime);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}", STORE_NAME, p.getName(), e.getMessage());
                try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
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
            extractFromTable(sastavDiv.selectFirst("table"), p);
            if (p.getProteinPer100g() != null) return;
        }

        // Fallback — search all tables
        for (Element t : root.select("table")) {
            String text = t.text().toLowerCase();
            if (text.contains("100") && (text.contains("proteini") || text.contains("belančevine"))) {
                extractFromTable(t, p);
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
                    if (cellText.equals("100g") || cellText.equals("100gr")) {
                        per100gCol = i;
                        break;
                    }
                }
                if (per100gCol >= 0) break;
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
                try { value = Double.parseDouble(rawValue); }
                catch (Exception e) { continue; }

                if (value < 0 || value > 10000) continue;

                // Protein
                if ((label.equals("proteini") || label.contains("belančevine"))
                        && !label.contains("koncentrat")) {
                    if (value <= 100) p.setProteinPer100g(value);
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
                // Calories — "400 kcal/1695 kJ" format
                else if (label.contains("energetska") || label.contains("kalorij")
                        || label.contains("energy")) {
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
                    if (per100g <= 100) p.setProteinPer100g(per100g);
                } else if (label.contains("masti") || label.contains("ukupne masti")) {
                    if (per100g <= 100) p.setFatPer100g(per100g);
                } else if (label.contains("šećeri") || label.contains("seceri")) {
                    if (per100g <= 100) p.setSugarPer100g(per100g);
                } else if (label.contains("energetska") || label.contains("kcal")) {
                    p.setCaloriePer100g(per100g);
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to parse serving table: {}", STORE_NAME, e.getMessage());
        }
    }

    // -------------------- Other enrichment --------------------

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

    private Product parseElement(Element el) {
        try {
            Product p = new Product();
            Element title = el.selectFirst("h3.woocommerce-loop-product__title");
            p.setName(title != null ? title.text().trim() : "");
            Element link = el.selectFirst("a.woocommerce-LoopProduct-link");
            p.setUrl(link != null ? link.attr("href") : "");
            Element img = el.selectFirst("img");
            p.setImageUrl(img != null ? img.attr("src") : "");
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