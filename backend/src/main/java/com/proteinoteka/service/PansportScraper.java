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

@Component
@Slf4j
@RequiredArgsConstructor
public class PansportScraper implements StoreScraper {

    private static final String STORE_NAME = "Pansport";
    private static final String BASE_URL = "https://www.pansport.rs/proteini/koncentrati-koncentrati-izolati-proteina-surutke-whey";

    private final NutritionParserService nutritionParser;

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
        return doc.selectFirst("li.pager__item--next a") != null;
    }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + page;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("div.product-teaser");
        log.info("[{}] Found {} products on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseProductElement(el);
            if (p != null) {
                products.add(p);
            } else {
                log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
            }
        }

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products);
        }

        return products;
    }

    // -------------------- Listing parsing --------------------

    private Product parseProductElement(Element element) {
        try {
            Product p = new Product();

            // 1. Naziv i URL
            Element title = element.selectFirst("h4.node__title a");
            if (title == null) return null;

            p.setName(title.text().trim());

            Element link = element.selectFirst("div.details a");
            if (link != null) {
                String href = link.attr("href");
                p.setUrl(href.startsWith("http") ? href : "https://www.pansport.rs" + href);
            }

            // 2. Slika
            Element img = element.selectFirst("div.teaser-image img");
            if (img != null) {
                String imgUrl = img.attr("src");
                if (imgUrl.isBlank()) {
                    imgUrl = img.attr("data-src");
                }
                if (!imgUrl.startsWith("http") && !imgUrl.isBlank()) {
                    imgUrl = "https://www.pansport.rs" + imgUrl;
                }
                p.setImageUrl(imgUrl);
            }

            // 3. Kratki opis (listing)
            Element description = element.selectFirst("div.field__item");
            if (description != null) {
                p.setDescription(description.text().trim());
            }

            // 4. Pakovanja iz select-a
            Elements weightOptions = element.select("select[id^=edit-attributes-field-attr-pakovanje] option");
            for (Element opt : weightOptions) {
                String weight = normalizeWeight(opt.text().trim());
                if (!weight.isBlank() && !p.getPackage_weight().contains(weight)) {
                    p.getPackage_weight().add(weight);
                }
            }

            // 5. Ukusi iz select-a
            Elements flavourOptions = element.select("select[id^=edit-attributes-field-attr-ukus] option");
            for (Element opt : flavourOptions) {
                String flavour = opt.text().trim();
                if (!flavour.isBlank() && !flavour.equals("--")
                        && !p.getFlavours().contains(flavour)) {
                    p.getFlavours().add(flavour);
                }
            }

            // 6. Cena
            Element priceEl = element.selectFirst("td.price-amount");
            if (priceEl != null) {
                String price = priceEl.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim();
                p.setPrice(price);
            }

            return p;

        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    /**
     * Normalizuje težinu: "33 g (kesica)" → "33g", "2.35 kg" → "2.35kg"
     */
    private String normalizeWeight(String weight) {
        return weight
                .replaceAll("\\s*\\(.*?\\)", "") // Ukloni zagrade i sadržaj
                .replaceAll("\\s+", "")           // Ukloni razmake
                .trim();
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;

            try {
                // ANTI-BAN: Random sleep 4-8s između proizvoda
                long sleep = 4000 + ThreadLocalRandom.current().nextLong(4000);
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

                Document doc = Jsoup.parse(page.content());

                // Enrichment
                enrichBrand(doc, p);
                enrichFullDescription(doc, p);
                enrichProtein(doc, p);

                log.info("[{}] ✓ Enriched '{}' -> brand={}, protein={}g/100g",
                        STORE_NAME, p.getName(), p.getBrand(), p.getProteinPer100g());

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
            return title.contains("Cloudflare")
                    || title.contains("Just a moment")
                    || title.contains("Attention Required")
                    || title.contains("Access denied");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Simulacija ljudskog ponašanja.
     */
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

    /**
     * Ekstraktuje brend sa detaljne strane.
     */
    private void enrichBrand(Document doc, Product p) {
        Element brand = doc.selectFirst("div.field--name-field-manufacturer a");
        if (brand != null) {
            String brandText = brand.text().trim()
                    .replaceAll("[\\uFFFD\\u0000-\\u001F]", "") // Očisti control characters
                    .trim();

            if (!brandText.isBlank()) {
                p.setBrand(brandText);
            }
        }
    }

    /**
     * Ekstraktuje pun opis proizvoda.
     */
    private void enrichFullDescription(Document doc, Product p) {
        Element fullDescEl = doc.selectFirst("div#node-product-body");
        if (fullDescEl != null) {
            String fullDesc = fullDescEl.text().trim();
            if (!fullDesc.isBlank()) {
                p.setDescription(fullDesc);
            }
        }
    }

    /**
     * Ekstraktuje protein na 100g.
     * Prioritet: tabela → NutritionParserService
     */
    private void enrichProtein(Document doc, Product p) {
        // 1. Pokušaj iz nutritivne tabele
        Double protein = extractProteinFromTable(doc);

        // 2. Fallback: NutritionParserService nad opisom
        if (protein == null && p.getDescription() != null && !p.getDescription().isBlank()) {
            protein = nutritionParser.extractProteinPer100g(p.getDescription());
        }

        if (protein != null) {
            p.setProteinPer100g(protein);
            log.info("[{}] '{}' -> protein: {}g/100g",
                    STORE_NAME, p.getName(), protein);
        } else {
            log.warn("[{}] '{}' -> protein not found",
                    STORE_NAME, p.getName());
        }
    }

    /**
     * Parsira nutritivnu tabelu.
     *
     * Pansport format:
     *   | Nutrient | Po porciji | Na 100g |
     *   | Proteini | 25g        | 83g     |
     *
     * Kolona 2 je per-100g (hardkodovano jer je Pansport konzistentan).
     */
    private Double extractProteinFromTable(Document doc) {
        try {
            Elements tables = doc.select("table");

            for (Element table : tables) {
                String tableText = table.text().toLowerCase();
                if (!tableText.contains("proteini") && !tableText.contains("protein")) {
                    continue;
                }

                Elements rows = table.select("tr");

                // Detektuj indeks "100g" kolone (bolje od hardkodiranog)
                int per100gCol = -1;
                if (!rows.isEmpty()) {
                    Elements headerCells = rows.get(0).select("th, td");
                    for (int i = 0; i < headerCells.size(); i++) {
                        String cellText = headerCells.get(i).text()
                                .toLowerCase()
                                .replaceAll("\\s+", "");
                        if (cellText.contains("100g")
                                || cellText.contains("na100")
                                || cellText.contains("per100")) {
                            per100gCol = i;
                            break;
                        }
                    }
                }

                // Fallback: pretpostavi da je kolona 2 ako header nije našao
                if (per100gCol < 0) {
                    per100gCol = 2;
                }

                // Nađi red sa proteinima
                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase();

                    boolean isProteinRow = (label.contains("proteini")
                            || label.contains("belančevine"))
                            && !label.contains("koncentrat")
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
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to extract protein from table: {}",
                    STORE_NAME, e.getMessage());
        }

        return null;
    }

    private void safeSleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}