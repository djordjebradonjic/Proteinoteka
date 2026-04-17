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
    public String getStoreName() {
        return STORE_NAME;
    }

    @Override
    public String getBaseUrl() {
        return BASE_URL;
    }

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
            if (p != null) {
                products.add(p);
            } else {
                log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
            }
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

            // 1. Naziv i URL
            Element title = el.selectFirst("h3.wd-entities-title a");
            if (title == null) return null;

            p.setName(title.text().trim());
            p.setUrl(title.attr("href"));

            // 2. Slika
            Element img = el.selectFirst("div.product-element-top img");
            if (img != null) {
                String imgUrl = img.attr("src");
                if (imgUrl.isBlank()) {
                    imgUrl = img.attr("data-src"); // Lazy load fallback
                }
                p.setImageUrl(imgUrl);
            }

            // 3. Cena
            Element price = el.selectFirst("span.woocommerce-Price-amount bdi");
            if (price != null) {
                p.setPrice(price.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim());
            }

            // 4. GTM data (opciono)
            Element gtm = el.selectFirst("span.gtm4wp_productdata");
            if (gtm != null) {
                parseGtmData(gtm.attr("data-gtm4wp_product_data"), p);
            }

            // 5. Ekstrakcija iz naziva
            extractPackageWeightFromName(p);
            extractBrandFromName(p);

            return p;

        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void parseGtmData(String json, Product p) {
        try {
            JsonNode data = objectMapper.readTree(json);
            // Trenutno ne koristimo GTM data, ali može se aktivirati po potrebi
        } catch (Exception e) {
            log.warn("[{}] Failed to parse GTM data: {}", STORE_NAME, e.getMessage());
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("(\\d+[.,]?\\d*\\s?(kg|g))", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(p.getName());

        while (matcher.find()) {
            String weight = matcher.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(weight)) {
                p.getPackage_weight().add(weight);
            }
        }
    }

    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        // Prvi segment naziva je obično brend
        String[] parts = p.getName().split("\\s+");
        if (parts.length > 0) {
            p.setBrand(parts[0].trim());
        }
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;

            try {
                // ANTI-BAN: Random sleep 4-10s između proizvoda
                long sleep = 4000 + ThreadLocalRandom.current().nextLong(6000);
                log.info("[{}] Sleeping {}s before '{}'...",
                        STORE_NAME, sleep / 1000, p.getName());
                Thread.sleep(sleep);

                // Navigacija sa retry
                boolean success = navigateWithRetry(page, p.getUrl(), 3);
                if (!success) {
                    log.error("[{}] Failed to load {} after retries, skipping",
                            STORE_NAME, p.getUrl());
                    continue;
                }

                // Firewall check
                if (isBlockedByFirewall(page)) {
                    log.error("[{}] FIREWALL DETECTED! Stopping scraper.", STORE_NAME);
                    return;
                }

                // Human behavior simulation
                simulateHumanBehavior(page);

                // Click description tab (sa error handling)
                try {
                    page.click("li.description_tab a", new Page.ClickOptions().setTimeout(3000));
                    page.waitForSelector("div#tab-description",
                            new Page.WaitForSelectorOptions().setTimeout(5000));
                } catch (Exception e) {
                    log.warn("[{}] Description tab not found for {}", STORE_NAME, p.getName());
                }

                // Click nutrition tab (opciono)
                try {
                    page.click("li.hranljive_tab_tab a", new Page.ClickOptions().setTimeout(3000));
                    page.waitForSelector("div#tab-hranljive_tab",
                            new Page.WaitForSelectorOptions().setTimeout(5000));
                } catch (Exception e) {
                    log.debug("[{}] No nutrition tab for {}", STORE_NAME, p.getName());
                }

                // Parse enriched data
                Document doc = Jsoup.parse(page.content());
                enrichVariations(doc, p);
                enrichDescription(doc, p);
                enrichProtein(doc, p);

                log.info("[{}] ✓ Enriched '{}' -> flavours={}, protein={}g/100g",
                        STORE_NAME, p.getName(), p.getFlavours().size(), p.getProteinPer100g());

                count++;

                // ANTI-BAN: Batch pause svakih 10 proizvoda
                if (count % 10 == 0) {
                    long batchSleep = 40000 + ThreadLocalRandom.current().nextLong(20000);
                    log.info("[{}] ⏸ Batch pause after {} products: {}s...",
                            STORE_NAME, count, batchSleep / 1000);
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}",
                        STORE_NAME, p.getName(), e.getMessage());
                safeSleep(5000);
            }
        }
    }

    /**
     * Navigacija sa retry logikom i exponential backoff.
     */
    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));

                page.waitForTimeout(500 + ThreadLocalRandom.current().nextInt(1000));
                return true;

            } catch (Exception e) {
                log.warn("[{}] Navigate retry {}/{} for {}: {}",
                        STORE_NAME, i + 1, maxRetries, url, e.getMessage());
                if (i < maxRetries - 1) {
                    safeSleep(2000 * (i + 1)); // Exponential backoff
                }
            }
        }
        return false;
    }

    /**
     * Provera firewall/Cloudflare blokade.
     */
    private boolean isBlockedByFirewall(Page page) {
        try {
            String title = page.title();
            String bodyText = page.textContent("body");

            return title.contains("Cloudflare")
                    || title.contains("Just a moment")
                    || title.contains("Attention Required")
                    || bodyText.contains("Access denied");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Simulacija ljudskog ponašanja - scroll, random pauze.
     */
    private void simulateHumanBehavior(Page page) {
        try {
            // Random scroll
            page.mouse().wheel(0, 200 + ThreadLocalRandom.current().nextInt(300));
            Thread.sleep(300 + ThreadLocalRandom.current().nextInt(400));

            page.mouse().wheel(0, 300 + ThreadLocalRandom.current().nextInt(200));
            Thread.sleep(200 + ThreadLocalRandom.current().nextInt(300));

            // Scroll nazad
            page.mouse().wheel(0, -150 - ThreadLocalRandom.current().nextInt(100));
            Thread.sleep(200 + ThreadLocalRandom.current().nextInt(200));

        } catch (Exception ignored) {}
    }

    /**
     * Ekstraktuje varijacije (ukuse) iz WooCommerce data-product_variations JSON-a.
     */
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
                    if (!p.getFlavours().contains(normalized)) {
                        p.getFlavours().add(normalized);
                    }
                }
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to parse variations for {}: {}",
                    STORE_NAME, p.getName(), e.getMessage());
        }
    }

    /**
     * Ekstraktuje opis iz description tab-a.
     */
    private void enrichDescription(Document doc, Product p) {
        try {
            Element descriptionEl = doc.selectFirst("div#tab-description div.ckeditor");
            if (descriptionEl != null) {
                String cleanDescription = HtmlCleaner.cleanDescription(descriptionEl.html());
                if (!cleanDescription.isBlank()) {
                    p.setDescription(cleanDescription);
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to extract description for {}: {}",
                    STORE_NAME, p.getName(), e.getMessage());
        }
    }

    /**
     * Ekstraktuje protein na 100g iz nutritivne tabele.
     */
    private void enrichProtein(Document doc, Product p) {
        try {
            Double protein = extractProteinFromNutritionTable(doc);
            if (protein != null) {
                p.setProteinPer100g(protein);
                log.info("[{}] '{}' -> protein: {}g/100g",
                        STORE_NAME, p.getName(), protein);
            } else {
                log.warn("[{}] '{}' -> protein not found",
                        STORE_NAME, p.getName());
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to extract protein for {}: {}",
                    STORE_NAME, p.getName(), e.getMessage());
        }
    }

    /**
     * Parsira nutritivnu tabelu.
     *
     * Proteini.si ima 2 formata:
     *   A) | Nutrient | 100g | Po porciji |  → kolona 1 je 100g
     *   B) | Nutrient | Po porciji | 100g |  → kolona 2 je 100g
     *
     * Detektujemo format iz header reda.
     */
    private Double extractProteinFromNutritionTable(Document doc) {
        try {
            Element nutritionTab = doc.selectFirst("div#tab-hranljive_tab");
            if (nutritionTab == null) return null;

            Elements rows = nutritionTab.select("table tr");
            if (rows.isEmpty()) return null;

            // Detektuj indeks "100g" kolone iz header reda
            int per100gCol = -1;
            for (Element row : rows) {
                Elements cells = row.select("td, th");
                if (cells.size() < 2) continue;

                for (int i = 0; i < cells.size(); i++) {
                    String cellText = cells.get(i).text()
                            .toLowerCase()
                            .replaceAll("\\s+", "");
                    if (cellText.contains("100g")
                            || cellText.contains("na100")
                            || cellText.contains("per100")) {
                        per100gCol = i;
                        break;
                    }
                }

                if (per100gCol >= 0) break;
            }

            if (per100gCol < 1) {
                log.debug("[{}] No '100g' column found in nutrition table", STORE_NAME);
                return null;
            }

            // Nađi red sa proteinima
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() <= per100gCol) continue;

                String label = cells.get(0).text().trim().toLowerCase();

                boolean isProteinRow = (label.contains("proteini")
                        || label.contains("belančevine"))
                        && !label.contains("koncentrat")
                        && !label.contains("graška")
                        && !label.contains("pirinča")
                        && !label.contains("izvor");

                if (isProteinRow) {
                    String val = cells.get(per100gCol).text()
                            .replaceAll("[^0-9,.]", "")
                            .replace(",", ".")
                            .trim();

                    if (!val.isBlank()) {
                        double protein = Double.parseDouble(val);
                        if (protein > 0 && protein <= 100) {
                            return protein;
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to extract protein from table: {}",
                    STORE_NAME, e.getMessage());
        }

        return null;
    }

    /**
     * Normalizuje slug ukusa u čitljiv naziv.
     */
    private String normalizeFlavour(String flavour) {
        return FLAVOUR_MAP.getOrDefault(flavour.toLowerCase(), flavour);
    }

    private void safeSleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}