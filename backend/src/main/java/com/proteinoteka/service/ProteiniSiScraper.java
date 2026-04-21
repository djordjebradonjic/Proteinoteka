package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.HtmlCleaner;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class ProteiniSiScraper implements StoreScraper {
    private final BaseScraperEnricher baseEnricher;
    private final NutritionParserService nutritionParser;


    private static final Map<String, String> FLAVOUR_MAP = Map.ofEntries(
            Map.entry("chocolate", "Čokolada"),
            Map.entry("vanilla", "Vanila"),
            Map.entry("strawberry", "Jagoda"),
            Map.entry("banana", "Banana"),
            Map.entry("cookies-cream", "Kolačić i krem"),
            Map.entry("cookies", "Kolačić"),
            Map.entry("chocolate-hazelnut-2", "Čokolada - lešnik"),
            Map.entry("chocolate-hazelnut-3", "Čokolada - lešnik"),
            Map.entry("chocolate-coconut", "Čokolada - kokos"),
            Map.entry("chocolate-banana", "Čokolada - banana"),
            Map.entry("white-chocolate", "Bela čokolada"),
            Map.entry("white-choc-straw", "Bela čokolada - jagoda"),
            Map.entry("white-choc-cocon", "Bela čokolada - kokos"),
            Map.entry("milk-chocolate", "Mlečna čokolada"),
            Map.entry("french-vanilla", "Vanila"),
            Map.entry("creamy-vanilla", "Vanila"),
            Map.entry("raspberry", "Malina"),
            Map.entry("natural", "Bez ukusa"),
            Map.entry("neutral", "Bez ukusa"),
            Map.entry("mixed-berries", "Mešano voće"),
            Map.entry("stracciatella-coconut", "Stracciatella - kokos"),
            Map.entry("blueberry-muffin", "Borovnica mafin"),
            Map.entry("cherry-yoghurt", "Trešnja - jogurt"),
            Map.entry("banana-yoghurt", "Banana - jogurt"),
            Map.entry("dark-equ-chocolate", "Tamna čokolada"),
            Map.entry("pistachio-coconut", "Pistać - kokos"),
            Map.entry("dubai-chocolate", "Dubai čokolada"),
            Map.entry("wheytella", "Wheytella"),
            Map.entry("cokolada-kokos", "Čokolada - kokos"),
            Map.entry("chocolate-brownies", "Čokolada brauni"),
            Map.entry("chocolate-cookie", "Čokolada kolačić")
    );

    private static final String STORE_NAME = "Proteini.si";
    private static final String BASE_URL = "https://proteinisi.rs/proteini/";
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        Elements elements = doc.select("div.wd-product");
        log.info("[{}] Found {} products on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) products.add(p);
            else log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
        }

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products);
        } else {
            log.info("[{}] Skipping enrichment (page is null)", STORE_NAME);
        }

        return products;
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element el) {
        try {
            Product p = new Product();

            Element title = el.selectFirst("h3.wd-entities-title a");
            if (title == null) return null;

            p.setName(title.text().trim());
            p.setUrl(title.attr("href"));

            Element img = el.selectFirst("div.product-element-top img");
            if (img != null) {
                String imgUrl = img.attr("src");
                if (imgUrl.isBlank()) imgUrl = img.attr("data-src");
                p.setImageUrl(imgUrl);
            }

            Element price = el.selectFirst("span.woocommerce-Price-amount bdi");
            if (price != null) {
                p.setPrice(price.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim());
            }

            extractPackageWeightFromName(p);
            extractBrandFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("(\\d+[.,]?\\d*\\s?(kg|g))", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(p.getName());
        while (matcher.find()) {
            String weight = matcher.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(weight)) p.getPackage_weight().add(weight);
        }
    }

    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        String[] parts = p.getName().split("\\s+");
        if (parts.length > 0) p.setBrand(parts[0].trim());
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;

            try {
                long sleep = 4000 + ThreadLocalRandom.current().nextLong(6000);
                log.info("[{}] Sleeping {}s before '{}'...", STORE_NAME, sleep / 1000, p.getName());
                Thread.sleep(sleep);

                boolean success = navigateWithRetry(page, p.getUrl(), 3);
                if (!success) {
                    log.error("[{}] Failed to load {} after retries, skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                if (isBlockedByFirewall(page)) {
                    log.error("[{}] FIREWALL DETECTED! Stopping scraper.", STORE_NAME);
                    return;
                }

                simulateHumanBehavior(page);

                try {
                    page.click("li.description_tab a", new Page.ClickOptions().setTimeout(3000));
                    page.waitForSelector("div#tab-description", new Page.WaitForSelectorOptions().setTimeout(5000));
                } catch (Exception e) {
                    log.warn("[{}] Description tab not found for {}", STORE_NAME, p.getName());
                }

                try {
                    page.click("li.hranljive_tab_tab a", new Page.ClickOptions().setTimeout(3000));
                    page.waitForSelector("div#tab-hranljive_tab", new Page.WaitForSelectorOptions().setTimeout(5000));
                } catch (Exception e) {
                    log.debug("[{}] No nutrition tab for {}", STORE_NAME, p.getName());
                }

                Document doc = Jsoup.parse(page.content());

                enrichVariations(doc, p);
                enrichDescription(doc, p);
                enrichNutrition(doc, p);

                log.info("[{}] Enriched '{}' -> flavours={}, protein={}, fat={}, sugar={}, cal={}",
                        STORE_NAME, p.getName(), p.getFlavours().size(),
                        p.getProteinPer100g(), p.getFatPer100g(),
                        p.getSugarPer100g(), p.getCaloriePer100g());

                count++;

                if (count % 10 == 0) {
                    long batchSleep = 40000 + ThreadLocalRandom.current().nextLong(20000);
                    log.info("[{}] Batch pause after {} products: {}s...", STORE_NAME, count, batchSleep / 1000);
                    Thread.sleep(batchSleep);
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
            log.warn("[{}] '{}' -> protein not found", STORE_NAME, p.getName());
        }

        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);

        log.info("[{}] '{}' -> protein: {}, sugar: {}, fat: {}, cal: {}",
                STORE_NAME, p.getName(),
                p.getProteinPer100g(), p.getSugarPer100g(),
                p.getFatPer100g(), p.getCaloriePer100g());
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        try {
            Element nutritionTab = doc.selectFirst("div#tab-hranljive_tab");
            if (nutritionTab == null) return;

            // Also enrich description with nutrition tab text
            if (p.getDescription() == null || p.getDescription().isBlank()) {
                Element descTab = doc.selectFirst("div#tab-description div.ckeditor");
                if (descTab != null) {
                    p.setDescription(descTab.text().trim());
                }
            }

            Elements tables = nutritionTab.select("table");
            if (tables.isEmpty()) return;

            for (Element table : tables) {
                String tableText = table.text().toLowerCase();
                if (!tableText.contains("proteini") && !tableText.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // Detect 100g column
                // Proteini.si format: | Nutritivna vrednost | 100g proizvoda... | Jedan obrok... | RU% |
                int per100gCol = -1;
                Elements headerCells = rows.get(0).select("td, th");
                for (int i = 0; i < headerCells.size(); i++) {
                    String cellText = headerCells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                    if (cellText.contains("100g") || cellText.contains("100gr")
                            || cellText.contains("na100") || cellText.contains("per100")) {
                        per100gCol = i;
                        break;
                    }
                }

                if (per100gCol < 1) continue;

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase()
                            .replaceAll("<[^>]*>", "") // strip any html tags
                            .replaceAll("\\*", "")     // strip asterisks
                            .trim();

                    String rawValue = cells.get(per100gCol).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();

                    if (rawValue.isBlank()) continue;

                    double value;
                    try { value = Double.parseDouble(rawValue); }
                    catch (Exception e) { continue; }

                    if (value < 0 || value > 10000) continue;

                    // Protein
                    if ((label.contains("proteini") || label.contains("belančevine"))
                            && !label.contains("koncentrat") && !label.contains("graška")
                            && !label.contains("pirinča") && !label.contains("izvor")) {
                        if (value <= 100) p.setProteinPer100g(value);
                    }
                    // Fat — samo "Masti", ne "zasićene"
                    else if ((label.equals("masti") || label.equals("fat"))
                            && !label.contains("zasić") && !label.contains("kojih")) {
                        if (value <= 100) p.setFatPer100g(value);
                    }
                    // Sugar — "od kojih seceri" ili "od čega šećeri"
                    else if ((label.contains("šećeri") || label.contains("seceri")
                            || label.contains("sugar"))
                            && !label.contains("bez")) {
                        if (value <= 100) p.setSugarPer100g(value);
                    }
                    // Calories — "1716 kJ/405 kcal" format
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

                if (p.getProteinPer100g() != null) break;
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to extract nutrition from table: {}", STORE_NAME, e.getMessage());
        }
    }

    // -------------------- Other enrichment --------------------

    private void enrichVariations(Document doc, Product p) {
        try {
            Element form = doc.selectFirst("form.variations_form");
            if (form == null) return;

            String json = form.attr("data-product_variations");
            if (json == null || json.isBlank()) return;

            JsonNode variations = objectMapper.readTree(json);
            for (JsonNode variation : variations) {
                String flavour = variation
                        .path("attributes")
                        .path("attribute_pa_izaberi-ukus")
                        .asText("");
                if (!flavour.isBlank()) {
                    String normalized = normalizeFlavour(flavour);
                    if (!p.getFlavours().contains(normalized)) p.getFlavours().add(normalized);
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to parse variations for {}: {}", STORE_NAME, p.getName(), e.getMessage());
        }
    }

    private void enrichDescription(Document doc, Product p) {
        try {
            Element descriptionEl = doc.selectFirst("div#tab-description div.ckeditor");
            if (descriptionEl != null) {
                String cleanDescription = HtmlCleaner.cleanDescription(descriptionEl.html());
                if (!cleanDescription.isBlank()) p.setDescription(cleanDescription);
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to extract description for {}: {}", STORE_NAME, p.getName(), e.getMessage());
        }
    }

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));
                page.waitForTimeout(500 + ThreadLocalRandom.current().nextInt(1000));
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
            String bodyText = page.textContent("body");
            return title.contains("Cloudflare") || title.contains("Just a moment")
                    || title.contains("Attention Required") || bodyText.contains("Access denied");
        } catch (Exception e) {
            return false;
        }
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

    private String normalizeFlavour(String flavour) {
        return FLAVOUR_MAP.getOrDefault(flavour.toLowerCase(), flavour);
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}