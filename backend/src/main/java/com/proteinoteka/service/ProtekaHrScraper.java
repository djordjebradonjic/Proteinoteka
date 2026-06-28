package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.ProductNameCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scrapes proteka.hr (custom "kanuni.hr" e-commerce, Alpine.js frontend, fully SSR).
 *
 * Strategy for minimising iProyal proxy credits:
 *   1. Listing page is fetched via plain JSoup (usePlaywrightForListing=false → no proxy).
 *      The SSR HTML already embeds brand, weight, image, flavours and price inside
 *      div[data-filterable-item] — no JS evaluation needed.
 *   2. Detail pages are fetched through JSoup only when nutrition data is incomplete.
 *      Products whose URLs appear in skipUrls (nutrition already complete in DB) are
 *      added to the result immediately without any network request.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProtekaHrScraper implements StoreScraper {

    private static final String STORE_NAME  = "Proteka";
    private static final String BASE_URL    = "https://www.proteka.hr/c/proteini";
    private static final String SITE_ORIGIN = "https://www.proteka.hr";

    private static final int MAX_DETAIL_FETCH_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    // Matches a decimal number such as "69.9" or "69,90"
    private static final Pattern PRICE_PATTERN  = Pattern.compile("[\\d]+[,.]?[\\d]*");
    // Matches weight in product name: "2kg", "2.27kg", "500g"
    private static final Pattern WEIGHT_PATTERN =
            Pattern.compile("(\\d+[.,]?\\d*)\\s*kg|([1-9]\\d{2,4})\\s*g", Pattern.CASE_INSENSITIVE);
    // Matches weight in "data-pakiranje" attribute: "2.27 kg", "500g", "2 kg"
    private static final Pattern PAKIRANJE_PATTERN =
            Pattern.compile("(\\d+[.,]?\\d*)\\s*kg|(\\d+[.,]?\\d*)\\s*g", Pattern.CASE_INSENSITIVE);
    // Extracts kcal specifically from "1613 kJ/383 kcal" — avoids picking up kJ value
    private static final Pattern KCAL_PATTERN =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*kcal", Pattern.CASE_INSENSITIVE);
    // Generic numeric extractor for nutrition values like "73g", "5 g"
    private static final Pattern NUTRITION_NUM =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)");
    // Extracts JSON from Alpine.js x-data attribute: Product({ product: {...} })
    private static final Pattern PRODUCT_JSON_PATTERN =
            Pattern.compile("Product\\(\\{\\s*product:\\s*(\\{.*?\\})\\s*\\}\\)", Pattern.DOTALL);

    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Override public String getStoreName()             { return STORE_NAME; }
    @Override public String getBaseUrl()               { return BASE_URL; }
    @Override public String getMarket()                { return "hr"; }
    @Override public String getCurrency()              { return "EUR"; }
    @Override public boolean usePlaywrightForListing() { return false; }
    @Override public boolean hasNextPage(Document doc) { return false; }
    @Override public String buildPageUrl(int page)     { return BASE_URL; }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, java.util.Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        Elements cards = doc.select("div[data-filterable-item]");
        log.info("[{}] Found {} product cards on listing page", STORE_NAME, cards.size());

        for (Element card : cards) {
            Product p = parseCard(card);
            if (p != null) stubs.add(p);
        }

        log.info("[{}] {} cards parsed, {} in skipUrls (nutrition complete — no detail fetch)",
                STORE_NAME, stubs.size(),
                stubs.stream().filter(s -> skipUrls.contains(s.getUrl())).count());

        return enrichWithDetails(stubs, skipUrls);
    }

    // ── Listing page parsing ───────────────────────────────────────────────────

    private Product parseCard(Element card) {
        try {
            // Name and URL from the product-title anchor
            Element nameAnchor = card.selectFirst("h5.product-title a, .product-title a");
            if (nameAnchor == null) return null;
            String name = nameAnchor.text().trim();
            if (name.isBlank()) return null;

            String href = nameAnchor.attr("href");
            if (href.isBlank()) href = card.attr("data-link");
            if (href.isBlank()) return null;
            String url = href.startsWith("http") ? href : SITE_ORIGIN + href;

            // Early category filter — avoids detail page fetch for non-protein products
            String category = card.attr("data-category").trim().toLowerCase();
            if (isNonProteinCategory(category)) {
                log.debug("[{}] Skipping '{}' — category '{}'", STORE_NAME, name, category);
                return null;
            }

            // Price from data-price attribute (already a clean decimal)
            Double price = parsePrice(card.attr("data-price").trim());

            // Brand from data-brand attribute (no detail page needed)
            String brand = card.attr("data-brand").trim();

            // Package weight from data-pakiranje attribute (may be blank)
            Double weightGrams = parsePakiranje(card.attr("data-pakiranje").trim());
            if (weightGrams == null) weightGrams = extractWeightFromName(name);

            // Image and flavours from Alpine.js JSON embedded in the inner product div
            String imageUrl  = null;
            List<String> flavours = new ArrayList<>();
            Element productDiv = card.selectFirst("[x-data]");
            if (productDiv != null) {
                String xData = productDiv.attr("x-data");
                JsonNode json = parseProductJson(xData);
                if (json != null) {
                    JsonNode imgNode = json.get("image");
                    if (imgNode != null && !imgNode.isNull()) {
                        String img = imgNode.asText().trim();
                        if (!img.isBlank()) {
                            imageUrl = img.startsWith("http") ? img : SITE_ORIGIN + img;
                        }
                    }
                    JsonNode options = json.get("options");
                    if (options != null && options.isArray()) {
                        for (JsonNode opt : options) {
                            JsonNode available = opt.get("available");
                            if (available != null && available.asBoolean()) {
                                JsonNode flName = opt.get("name");
                                if (flName != null && !flName.isNull()) {
                                    String fl = flName.asText().trim();
                                    if (!fl.isBlank()) flavours.add(fl);
                                }
                            }
                        }
                    }
                }
            }

            // Fallback image from img tag
            if (imageUrl == null) {
                Element img = card.selectFirst("img[data-src], img[src]");
                if (img != null) {
                    imageUrl = img.attr("data-src");
                    if (imageUrl.isBlank()) imageUrl = img.attr("src");
                    if (imageUrl != null && !imageUrl.startsWith("http"))
                        imageUrl = SITE_ORIGIN + imageUrl;
                }
            }

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(url);
            if (price != null) p.setPrice(String.valueOf(price));
            if (!brand.isBlank()) p.setBrand(brand);
            if (weightGrams != null && weightGrams > 0) p.setPrimaryWeightGrams(weightGrams);
            if (imageUrl != null && !imageUrl.isBlank()) p.setImageUrl(imageUrl);
            if (!flavours.isEmpty()) p.setFlavours(flavours);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing card: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private boolean isNonProteinCategory(String cat) {
        return cat.contains("gainer") || cat.contains("masa") || cat.contains("bar")
                || cat.contains("kreatin") || cat.contains("vitamin") || cat.contains("omega")
                || cat.contains("kolagen") || cat.contains("collag");
    }

    // ── Detail page enrichment ─────────────────────────────────────────────────

    private List<Product> enrichWithDetails(List<Product> stubs, Set<String> skipUrls) {
        List<Product> result = new ArrayList<>();
        int consecutiveFailures = 0;

        for (Product stub : stubs) {
            if (stub.getUrl() == null || stub.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(stub.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, stub.getName());
                continue;
            }

            // Nutrition already complete in DB — no need to hit the detail page at all
            if (skipUrls.contains(stub.getUrl())) {
                log.debug("[{}] '{}' — nutrition complete, skipping detail fetch", STORE_NAME, stub.getName());
                result.add(stub);
                continue;
            }

            Document doc = fetchDetailPage(stub.getUrl());
            if (doc == null) {
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    log.error("[{}] {} consecutive failures — stopping enrichment", STORE_NAME, consecutiveFailures);
                    return result;
                }
                continue;
            }
            consecutiveFailures = 0;

            try {
                enrichProduct(doc, stub);
                result.add(stub);
                log.info("[{}] Enriched '{}' protein={}g/100g", STORE_NAME, stub.getName(), stub.getProteinPer100g());
            } catch (Exception e) {
                log.error("[{}] Error enriching '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(2000 + ThreadLocalRandom.current().nextLong(2000));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p) {
        // Brand fallback from the "Proizvođač" info table if not set from listing
        if (p.getBrand() == null || p.getBrand().isBlank()) {
            for (Element row : doc.select("table.table tr")) {
                String label = row.selectFirst("td:first-child") != null
                        ? row.selectFirst("td:first-child").text().toLowerCase() : "";
                if (label.contains("proizvođač") || label.contains("brand")) {
                    Element link = row.selectFirst("td:last-child a");
                    if (link != null && !link.text().isBlank()) {
                        p.setBrand(link.text().trim());
                        break;
                    }
                }
            }
        }

        // Description from the "Opis proizvoda" section (class="story")
        Element storyEl = doc.selectFirst(".story");
        if (storyEl != null) {
            String desc = storyEl.text().trim();
            if (!desc.isBlank() && (p.getDescription() == null || p.getDescription().isBlank())) {
                p.setDescription(desc.length() > 3000 ? desc.substring(0, 3000) : desc);
            }
        }

        extractNutritionFromTable(doc, p);
        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
    }

    /**
     * Parses the nutrition table on Proteka product pages.
     *
     * Two table formats exist on proteka.hr:
     *
     *   A) 3-column "Deklaracija proizvoda": label | per-100g | per-serving
     *      → use column 2 (td:nth-child(2)) as the 100g value.
     *
     *   B) 2-column "Sastav": label | per-serving-only (no 100g column)
     *      → detect via header text; convert values using the serving size (e.g. 35g).
     *      If serving size cannot be determined, skip the value so AI can fill it.
     *
     * Both formats may use {@code <p>} elements inside cells (e.g. Masti / zasićene).
     * Energy is rendered as "1613 kJ/383 kcal"; we always extract the kcal part.
     */
    private void extractNutritionFromTable(Document doc, Product p) {
        // Primary: find the table inside the div after h4 "Deklaracija proizvoda"
        Element declTable = null;
        for (Element heading : doc.select("h4, h3, h2")) {
            if (heading.text().toLowerCase().contains("deklaracija")) {
                Element next = heading.nextElementSibling();
                if (next != null) declTable = next.selectFirst("table");
                break;
            }
        }
        // Fallback: any table whose text contains both a protein keyword and an energy keyword
        if (declTable == null) {
            for (Element table : doc.select("table")) {
                String text = table.text().toLowerCase();
                boolean hasProtein = text.contains("proteini") || text.contains("protein")
                        || text.contains("bjelančevine");
                boolean hasEnergy  = text.contains("kcal") || text.contains("kj");
                if (hasProtein && hasEnergy) { declTable = table; break; }
            }
        }
        if (declTable == null) {
            log.debug("[{}] No nutrition table found for '{}'", STORE_NAME, p.getName());
            return;
        }

        // Inspect the header row to determine whether a 100g column exists and the serving size
        boolean has100gColumn = false;
        Double servingSizeG   = null;

        Element headerRow = declTable.selectFirst("tr");
        if (headerRow != null) {
            String headerText = headerRow.text().toLowerCase();
            has100gColumn = headerText.contains("100g") || headerText.contains("100 g");
            if (!has100gColumn) {
                // Try to read serving size from the only value column header (e.g. "jedna mjerica 35g")
                Matcher sm = Pattern.compile("(\\d+)\\s*g").matcher(headerText);
                if (sm.find()) {
                    try { servingSizeG = Double.parseDouble(sm.group(1)); }
                    catch (NumberFormatException ignored) {}
                }
            }
        }

        // Scale factor: 1.0 when table has a 100g column; 100/servingG when per-serving-only
        final double scaleTo100g;
        if (has100gColumn) {
            scaleTo100g = 1.0;
            log.debug("[{}] '{}' — 3-col table (100g column present)", STORE_NAME, p.getName());
        } else if (servingSizeG != null && servingSizeG > 0) {
            scaleTo100g = 100.0 / servingSizeG;
            log.debug("[{}] '{}' — 2-col table (per {}g serving), scale ×{}", STORE_NAME, p.getName(), servingSizeG.intValue(), String.format("%.2f", scaleTo100g));
        } else {
            // Can't determine serving size — skip numeric nutrition, let AI fill
            log.debug("[{}] '{}' — serving-only table but no serving size found, skipping numerics", STORE_NAME, p.getName());
            return;
        }

        for (Element row : declTable.select("tr")) {
            Element labelCell = row.selectFirst("td:nth-child(1), th:nth-child(1)");
            Element valueCell = row.selectFirst("td:nth-child(2), th:nth-child(2)");
            if (labelCell == null || valueCell == null) continue;

            Elements labelParagraphs = labelCell.select("p");
            Elements valueParagraphs = valueCell.select("p");

            if (!labelParagraphs.isEmpty() && !valueParagraphs.isEmpty()) {
                for (int i = 0; i < labelParagraphs.size() && i < valueParagraphs.size(); i++) {
                    String label = labelParagraphs.get(i).text().toLowerCase().trim();
                    String value = valueParagraphs.get(i).text().trim();
                    applyNutritionField(label, value, scaleTo100g, p);
                }
            } else {
                String label = labelCell.text().toLowerCase().trim();
                String value = valueCell.text().trim();
                applyNutritionField(label, value, scaleTo100g, p);
            }
        }
    }

    private void applyNutritionField(String label, String value, double scaleTo100g, Product p) {
        if (label.isBlank() || value.isBlank()) return;

        if ((label.contains("energet") || label.contains("kalorij"))
                && !label.contains("zasić")) {
            // "1613 kJ/383 kcal" — always use kcal, not kJ
            Double kcal = parseKcal(value);
            if (kcal != null && kcal > 0 && p.getCaloriePer100g() == null) {
                p.setCaloriePer100g(round1(kcal * scaleTo100g));
            }

        } else if (label.contains("protein") || label.equals("bjelančevine")
                || label.contains("bjelancevine")) {
            Double v = parseNutritionNumber(value);
            if (v != null && v > 0 && p.getProteinPer100g() == null) {
                double scaled = round1(v * scaleTo100g);
                if (scaled <= 100) p.setProteinPer100g(scaled);
            }

        } else if (label.contains("šećer") || label.contains("secer") || label.contains("šeće")) {
            Double v = parseNutritionNumber(value);
            if (v != null && v >= 0 && p.getSugarPer100g() == null) {
                p.setSugarPer100g(round1(v * scaleTo100g));
            }

        } else if (label.contains("mast") && !label.contains("zasić")
                && !label.contains("zasic")) {
            Double v = parseNutritionNumber(value);
            if (v != null && v >= 0 && p.getFatPer100g() == null) {
                p.setFatPer100g(round1(v * scaleTo100g));
            }
        }
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    // ── Parsers ────────────────────────────────────────────────────────────────

    private Double parsePrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw.replace(",", "."));
        } catch (NumberFormatException e) {
            Matcher m = PRICE_PATTERN.matcher(raw);
            if (m.find()) {
                try { return Double.parseDouble(m.group().replace(",", ".")); }
                catch (NumberFormatException ignored) {}
            }
            return null;
        }
    }

    private Double parsePakiranje(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher m = PAKIRANJE_PATTERN.matcher(raw);
        if (!m.find()) return null;
        try {
            if (m.group(1) != null) {
                double kg = Double.parseDouble(m.group(1).replace(",", "."));
                return kg * 1000;
            }
            if (m.group(2) != null) {
                double g = Double.parseDouble(m.group(2).replace(",", "."));
                if (g >= 50) return g;
            }
        } catch (NumberFormatException ignored) {}
        return null;
    }

    private Double extractWeightFromName(String name) {
        if (name == null) return null;
        Matcher m = WEIGHT_PATTERN.matcher(name);
        while (m.find()) {
            try {
                if (m.group(1) != null) return Double.parseDouble(m.group(1).replace(",", ".")) * 1000;
                if (m.group(2) != null) {
                    double g = Double.parseDouble(m.group(2));
                    if (g >= 100) return g;
                }
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    /** Extracts kcal from strings like "1613 kJ/383 kcal" or "383 kcal". */
    private Double parseKcal(String raw) {
        if (raw == null) return null;
        Matcher m = KCAL_PATTERN.matcher(raw);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (NumberFormatException ignored) {}
        }
        return null;
    }

    /** Extracts the first numeric value from strings like "73g", "5 g", "7,5g". */
    private Double parseNutritionNumber(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher m = NUTRITION_NUM.matcher(raw);
        if (!m.find()) return null;
        try { return Double.parseDouble(m.group(1).replace(",", ".")); }
        catch (NumberFormatException e) { return null; }
    }

    /**
     * Parses the Alpine.js {@code x-data} attribute to extract the embedded product JSON.
     * Format: {@code Product({ product: {...} })}
     */
    private JsonNode parseProductJson(String xData) {
        if (xData == null || xData.isBlank()) return null;
        try {
            Matcher m = PRODUCT_JSON_PATTERN.matcher(xData);
            if (!m.find()) return null;
            return objectMapper.readTree(m.group(1));
        } catch (Exception e) {
            log.debug("[{}] Could not parse product JSON from x-data: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    // ── HTTP ───────────────────────────────────────────────────────────────────

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_DETAIL_FETCH_RETRIES; attempt++) {
            try {
                return httpClient.connection(url)
                        .header("Accept-Language", "hr-HR,hr;q=0.9,en;q=0.8")
                        .get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}",
                        STORE_NAME, attempt, MAX_DETAIL_FETCH_RETRIES, url, e.getMessage());
                safeSleep(3000L * attempt);
            }
        }
        return null;
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
