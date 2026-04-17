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
public class FitLabScraper implements StoreScraper {

    private static final String STORE_NAME = "FitLab";
    private static final String BASE_URL = "https://fitlab.rs/sr/suplementi/proteini";

    private final NutritionParserService nutritionParser;

    @Override
    public String getStoreName() {
        return STORE_NAME;
    }

    @Override
    public String getBaseUrl() {
        return BASE_URL;
    }

    /**
     * Next.js paginacija - verovatno infinity scroll.
     * Limitiramo na max 3 stranice zbog anti-ban mere.
     */
    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        // Намерно ограничавамо на 3 странице максимално за FitLab
        // jer je Next.js sajt sa jacim fingerprinting-om
        return false; // Искључујемо пагинацију - само прва страница
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        // Next.js product cards
        Elements elements = doc.select("div[data-index]");
        log.info("[{}] Found {} products on listing page", STORE_NAME, elements.size());

        // ANTI-BAN: Limitiraj na max 20 proizvoda po scrape-u
        int maxProducts = Math.min(elements.size(), 20);
        log.info("[{}] Processing only first {} products (anti-ban limit)",
                STORE_NAME, maxProducts);

        for (int i = 0; i < maxProducts; i++) {
            Element el = elements.get(i);
            Product p = parseElement(el);
            if (p != null) {
                products.add(p);
            }
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

            // 1. Naziv i URL
            Element titleLink = el.selectFirst("h2 a, a[href*='/proizvodi/']");
            if (titleLink == null) {
                Elements links = el.select("a[href]");
                for (Element link : links) {
                    String href = link.attr("href");
                    if (href.contains("/proizvodi/")) {
                        titleLink = link;
                        break;
                    }
                }
            }
            if (titleLink == null) return null;

            Element h2 = el.selectFirst("h2");
            if (h2 != null) {
                p.setName(h2.text().trim());
            } else {
                String ariaLabel = titleLink.attr("aria-label");
                if (!ariaLabel.isBlank()) {
                    p.setName(ariaLabel.trim());
                } else {
                    p.setName(titleLink.text().trim());
                }
            }

            String url = titleLink.attr("href");
            if (url.startsWith("/")) {
                url = "https://fitlab.rs" + url;
            }
            p.setUrl(url);

            // 2. Slika
            Element img = el.selectFirst("img");
            if (img != null) {
                String imgUrl = img.attr("src");
                String srcset = img.attr("srcset");

                if (!srcset.isEmpty()) {
                    String[] parts = srcset.split(",");
                    String largest = parts[parts.length - 1].trim().split("\\s+")[0];
                    if (largest.startsWith("/_next/")) {
                        imgUrl = "https://fitlab.rs" + largest;
                    } else if (largest.startsWith("http")) {
                        imgUrl = largest;
                    }
                } else if (imgUrl.startsWith("/_next/")) {
                    imgUrl = "https://fitlab.rs" + imgUrl;
                }

                p.setImageUrl(imgUrl);
            }

            // 3. Cena + Filter
            Element priceEl = el.selectFirst("span:contains(RSD)");
            if (priceEl != null) {
                String price = priceEl.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim();
                p.setPrice(price);

                try {
                    double numericPrice = Double.parseDouble(
                            price.replace(".", "")
                                    .replace(",", ".")
                                    .replaceAll("[^0-9.]", "")
                    );

                    if (numericPrice < 500) {
                        log.debug("[{}] Skipping '{}' — price {}RSD < 500RSD",
                                STORE_NAME, p.getName(), numericPrice);
                        return null;
                    }
                } catch (Exception e) {
                    log.warn("[{}] Failed to parse price: '{}'", STORE_NAME, price);
                }
            } else {
                return null;
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

        String[] parts = p.getName().split("\\s+[–—-]\\s+");
        if (parts.length >= 2) {
            String brand = parts[parts.length - 1].trim()
                    .replaceAll("[™®©]", "")
                    .trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
            }
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        Matcher m = Pattern
                .compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE)
                .matcher(p.getName());

        while (m.find()) {
            String w = m.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(w)) {
                p.getPackage_weight().add(w);
            }
        }
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;

            try {
                // ANTI-BAN: JAKO dug sleep između proizvoda (10-20s)
                long sleep = 10000 + ThreadLocalRandom.current().nextLong(10000);
                log.info("[{}] Sleeping {}s before enriching '{}'...",
                        STORE_NAME, sleep / 1000, p.getName());
                Thread.sleep(sleep);

                // Navigacija sa timeout-om
                boolean success = false;
                for (int retry = 0; retry < 3; retry++) {
                    try {
                        page.navigate(p.getUrl(), new Page.NavigateOptions()
                                .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                                .setTimeout(30000)); // Duži timeout za Next.js

                        // Firewall check
                        String title = page.title();
                        if (title.contains("Cloudflare")
                                || title.contains("Attention Required")
                                || title.contains("Just a moment")
                                || title.contains("Access denied")
                                || title.contains("Bot detection")) {
                            log.error("[{}] FIREWALL DETECTED on {}! Stopping immediately.",
                                    STORE_NAME, p.getUrl());
                            return; // Zaustavi ceo scraper odmah
                        }

                        // Next.js hydration wait - JAKO važno
                        page.waitForTimeout(2000 + ThreadLocalRandom.current().nextInt(2000));

                        // Dodatni human behavior - scroll
                        simulateReading(page);

                        success = true;
                        break;

                    } catch (Exception e) {
                        log.warn("[{}] Retry {}/3 for {}: {}",
                                STORE_NAME, retry + 1, p.getUrl(), e.getMessage());
                        if (retry < 2) {
                            Thread.sleep(5000 * (retry + 1)); // Exponential backoff
                        }
                    }
                }

                if (!success) {
                    log.error("[{}] Failed to load {} after 3 retries, skipping",
                            STORE_NAME, p.getUrl());
                    continue;
                }

                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichFlavours(doc, p);
                enrichPackageWeights(doc, p);
                enrichDescription(doc, p);
                enrichProteinPer100g(doc, p);

                log.info("[{}] ✓ Enriched '{}' -> protein={}g/100g",
                        STORE_NAME, p.getName(), p.getProteinPer100g());

                count++;

                // ANTI-BAN: Batch pauza svakih 5 proizvoda (ne 15)
                if (count % 5 == 0) {
                    long batchSleep = 60000 + ThreadLocalRandom.current().nextLong(60000);
                    log.info("[{}] ⏸ Batch pause after {} products: {}s...",
                            STORE_NAME, count, batchSleep / 1000);
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}",
                        STORE_NAME, p.getName(), e.getMessage());

                // ANTI-BAN: Ako ima error, duža pauza pre nastavka
                safeSleep(15000);
            }
        }
    }

    /**
     * Simulira čitanje strane - scroll gore-dole, random pauze
     */
    private void simulateReading(Page page) {
        try {
            // Scroll malo dole
            page.mouse().wheel(0, 300 + ThreadLocalRandom.current().nextInt(200));
            Thread.sleep(500 + ThreadLocalRandom.current().nextInt(500));

            // Scroll još malo
            page.mouse().wheel(0, 400 + ThreadLocalRandom.current().nextInt(300));
            Thread.sleep(700 + ThreadLocalRandom.current().nextInt(500));

            // Scroll nazad gore
            page.mouse().wheel(0, -200 - ThreadLocalRandom.current().nextInt(100));
            Thread.sleep(300 + ThreadLocalRandom.current().nextInt(300));

        } catch (Exception ignored) {}
    }

    private void enrichBrand(Document doc, Product p) {
        Element brandSchema = doc.selectFirst("[itemprop=brand]");
        if (brandSchema != null) {
            String brand = brandSchema.text().trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
                return;
            }
        }

        Element meta = doc.selectFirst("meta[property='product:brand']");
        if (meta != null) {
            String brand = meta.attr("content").trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
            }
        }
    }

    private void enrichFlavours(Document doc, Product p) {
        Elements selectOptions = doc.select("select option");
        for (Element opt : selectOptions) {
            String optText = opt.text().toLowerCase();
            if (optText.contains("ukus") || optText.contains("flavor")) {
                Element select = opt.parent();
                if (select != null) {
                    for (Element flavorOpt : select.select("option")) {
                        String value = flavorOpt.attr("value");
                        String text = flavorOpt.text().trim();
                        if (!value.isBlank() && !text.isBlank()
                                && !text.equals("--")
                                && !p.getFlavours().contains(text)) {
                            p.getFlavours().add(text);
                        }
                    }
                }
                return;
            }
        }

        Elements buttons = doc.select("button[data-variant], button[aria-label*=ukus]");
        for (Element btn : buttons) {
            String text = btn.text().trim();
            String label = btn.attr("aria-label");
            String flavour = !text.isBlank() ? text : label;

            if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                p.getFlavours().add(flavour);
            }
        }
    }

    private void enrichPackageWeights(Document doc, Product p) {
        Elements selectOptions = doc.select("select option");
        List<String> weights = new ArrayList<>();

        for (Element opt : selectOptions) {
            String optText = opt.text().toLowerCase();
            if (optText.contains("pakovanje") || optText.contains("veličina")
                    || optText.contains("gramaza")) {
                Element select = opt.parent();
                if (select != null) {
                    for (Element weightOpt : select.select("option")) {
                        String text = weightOpt.text().trim();
                        if (!text.isBlank() && !text.equals("--")) {
                            String normalized = text.replaceAll("\\s+", "");
                            if (!weights.contains(normalized)) {
                                weights.add(normalized);
                            }
                        }
                    }
                }
                break;
            }
        }

        if (!weights.isEmpty()) {
            p.getPackage_weight().clear();
            p.getPackage_weight().addAll(weights);
        }
    }

    private void enrichDescription(Document doc, Product p) {
        Element desc = doc.selectFirst("div[class*='description'], div[class*='product-info']");
        if (desc != null) {
            String text = desc.text().trim();
            if (!text.isBlank()) {
                p.setDescription(text);
                return;
            }
        }

        Element metaDesc = doc.selectFirst("meta[name=description]");
        if (metaDesc != null) {
            String text = metaDesc.attr("content").trim();
            if (!text.isBlank()) {
                p.setDescription(text);
            }
        }
    }

    private void enrichProteinPer100g(Document doc, Product p) {
        Double protein = extractProteinFromTable(doc);
        if (protein != null) {
            p.setProteinPer100g(protein);
            log.info("[{}] '{}' -> {}g/100g (from table)",
                    STORE_NAME, p.getName(), protein);
            return;
        }

        if (p.getDescription() != null && !p.getDescription().isBlank()) {
            protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) {
                p.setProteinPer100g(protein);
                log.info("[{}] '{}' -> {}g/100g (from description)",
                        STORE_NAME, p.getName(), protein);
                return;
            }
        }

        log.warn("[{}] '{}' -> protein not found", STORE_NAME, p.getName());
    }

    private Double extractProteinFromTable(Document doc) {
        Double protein = extractFromHtmlTable(doc);
        if (protein != null) return protein;
        return extractFromPlainText(doc);
    }

    private Double extractFromHtmlTable(Document doc) {
        Elements tables = doc.select("table");

        for (Element table : tables) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini") && !tableText.contains("protein")) {
                continue;
            }

            try {
                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                int per100gCol = -1;
                Elements headerCells = rows.get(0).select("th, td");
                for (int i = 0; i < headerCells.size(); i++) {
                    String cellText = headerCells.get(i).text()
                            .toLowerCase()
                            .replaceAll("\\s+", "");
                    if (cellText.contains("na100g")
                            || cellText.contains("100g")
                            || cellText.contains("per100")) {
                        per100gCol = i;
                        break;
                    }
                }

                if (per100gCol < 1) continue;

                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase();
                    boolean isProteinRow = (label.contains("proteini")
                            || label.equals("protein"))
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
            } catch (Exception e) {
                log.warn("[{}] Failed to parse HTML table: {}", STORE_NAME, e.getMessage());
            }
        }

        return null;
    }

    private Double extractFromPlainText(Document doc) {
        Elements paragraphs = doc.select("p, div");

        for (Element p : paragraphs) {
            String text = p.text();

            if (!text.toLowerCase().contains("protein")) {
                continue;
            }

            try {
                // Pattern 1: "83,3% whey proteina"
                Pattern percentPattern = Pattern.compile(
                        "(\\d+[.,]?\\d*)\\s*%.*?protein",
                        Pattern.CASE_INSENSITIVE
                );

                Matcher percentM = percentPattern.matcher(text);
                if (percentM.find()) {
                    String percentStr = percentM.group(1).replace(",", ".");
                    double protein = Double.parseDouble(percentStr);

                    if (protein > 0 && protein <= 100) {
                        log.info("[{}] From percentage: {}%", STORE_NAME, protein);
                        return protein;
                    }
                }

                if (!text.toLowerCase().contains("100g")) {
                    continue;
                }

                // Pattern 2: "Proteini 12g / 60g"
                Pattern slashPattern = Pattern.compile(
                        "proteini[^/]*?(\\d+[.,]?\\d*)\\s*g\\s*/\\s*(\\d+[.,]?\\d*)\\s*g",
                        Pattern.CASE_INSENSITIVE
                );

                Matcher slashM = slashPattern.matcher(text);
                if (slashM.find()) {
                    String per100gStr = slashM.group(2).replace(",", ".");
                    double protein = Double.parseDouble(per100gStr);

                    if (protein > 0 && protein <= 100) {
                        log.info("[{}] From slash format: {}g/100g", STORE_NAME, protein);
                        return protein;
                    }
                }

                // Pattern 3: "U 100g / ... Proteini ... / 60g"
                Pattern altPattern = Pattern.compile(
                        "u\\s+100g[^/]*/.*?proteini[^/]*?/\\s*(\\d+[.,]?\\d*)\\s*g",
                        Pattern.CASE_INSENSITIVE
                );

                Matcher altM = altPattern.matcher(text);
                if (altM.find()) {
                    String proteinStr = altM.group(1).replace(",", ".");
                    double protein = Double.parseDouble(proteinStr);

                    if (protein > 0 && protein <= 100) {
                        log.info("[{}] From alt format: {}g/100g", STORE_NAME, protein);
                        return protein;
                    }
                }

            } catch (Exception e) {
                log.warn("[{}] Failed to parse plain text: {}", STORE_NAME, e.getMessage());
            }
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