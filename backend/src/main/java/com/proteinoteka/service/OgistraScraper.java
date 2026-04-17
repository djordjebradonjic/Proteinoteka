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

    @Override
    public String getStoreName() {
        return STORE_NAME;
    }

    @Override
    public String getBaseUrl() {
        return BASE_URL;
    }

    /**
     * PrestaShop paginacija: ?page=2, ?page=3...
     */
    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    /**
     * PrestaShop "next" link za paginaciju.
     */
    @Override
    public boolean hasNextPage(Document doc) {
        Element next = doc.selectFirst("a[rel=next]");
        if (next != null) return true;

        next = doc.selectFirst("li.next:not(.disabled) a");
        if (next != null) return true;

        next = doc.selectFirst("a.next.js-search-link");
        return next != null;
    }

    /**
     * Ogistra koristi Jsoup za listing (nema Cloudflare na listing stranicama).
     */
    @Override
    public boolean usePlaywrightForListing() {
        return false;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        // PrestaShop product card: article.product-miniature
        Elements elements = doc.select("article.product-miniature");
        log.info("[{}] Found {} products on listing page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) {
                products.add(p);
            } else {
                log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
            }
        }

        // Enrichment (detail scraping) — samo ako je Playwright dostupan
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
            Element titleLink = el.selectFirst("h3 a.product_name");
            if (titleLink == null) {
                titleLink = el.selectFirst("h3 a");
            }
            if (titleLink == null) return null;

            p.setName(titleLink.text().trim());
            String url = titleLink.attr("href");

            // Očisti URL fragment (#/33-ukus-jaffa)
            if (url.contains("#")) {
                url = url.substring(0, url.indexOf("#"));
            }
            p.setUrl(url);

            // 2. Slika (PrestaShop koristi data-src za lazy load)
            Element img = el.selectFirst("img.first-image");
            if (img != null) {
                String imgUrl = img.attr("data-src");
                if (imgUrl.isBlank()) {
                    imgUrl = img.attr("src");
                }
                // Zameni home_default sa large_default za veću sliku
                if (imgUrl.contains("home_default")) {
                    imgUrl = imgUrl.replace("home_default", "large_default");
                }
                p.setImageUrl(imgUrl);
            }

            // 3. Cena: "8.190,00 RSD"
            Element priceEl = el.selectFirst("span.price");
            if (priceEl != null) {
                String price = priceEl.text()
                        .replace("\u00a0", "")  // Non-breaking space
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
                        log.debug("[{}] Skipping '{}' — price {}RSD < 500RSD (small package)",
                                STORE_NAME, p.getName(), numericPrice);
                        return null;
                    }
                } catch (Exception e) {
                    log.warn("[{}] Failed to parse price for filtering: '{}'", STORE_NAME, price);
                    // Nastavi dalje ako parsing cene ne uspe — možda je neobičan format
                }
            }

            // 4. Brend iz naziva: "Naziv Proizvoda - BREND"
            extractBrandFromName(p);

            // 5. Težina iz naziva: "...3.5KG" ili "...500G"
            extractPackageWeightFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    /**
     * Ogistra format naziva: "THE Amino Whey Hydro protein 3.5KG"
     * Brend obično NIJE u naslovu (kao kod drugih), već u breadcrumb/meta tagovima.
     * Fallback: izvuci iz poslednjeg segmenta ako ima " - "
     */
    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        String[] parts = p.getName().split("\\s+[–—-]\\s+");
        if (parts.length >= 2) {
            String brand = parts[parts.length - 1].trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
            }
        }

        // Ogistra često ima "THE Nutrition" kao brend
        if (p.getBrand() == null && p.getName().toUpperCase().contains("THE ")) {
            p.setBrand("THE Nutrition");
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        // Pattern: "3.5KG", "3,5kg", "500g", "500G"
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
                Thread.sleep(ThreadLocalRandom.current().nextLong(2500, 5000));

                page.navigate(p.getUrl(), new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));

                // Firewall check
                String title = page.title();
                if (title.contains("Cloudflare")
                        || title.contains("Attention Required")
                        || title.contains("Just a moment")) {
                    log.error("[{}] FIREWALL DETECTED on {}! Stopping.",
                            STORE_NAME, p.getUrl());
                    return;
                }

                page.waitForTimeout(500 + (int)(Math.random() * 1000));

                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichFlavours(doc, p);
                enrichDescription(doc, p);
                enrichProteinPer100g(doc, p);

                log.info("[{}] Enriched '{}' -> brand={}, flavours={}, protein={}",
                        STORE_NAME, p.getName(), p.getBrand(),
                        p.getFlavours().size(), p.getProteinPer100g());

                count++;
                if (count % 15 == 0) {
                    long longSleep = ThreadLocalRandom.current().nextLong(40000, 60000);
                    log.info("[{}] Batch of 15 done, sleeping {}s...",
                            STORE_NAME, longSleep / 1000);
                    Thread.sleep(longSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}",
                        STORE_NAME, p.getName(), e.getMessage());
                safeSleep(5000);
            }
        }
    }

    /**
     * Brend sa detaljne strane.
     * Lokacije:
     *   - span[itemprop=brand]
     *   - div.product-manufacturer
     *   - meta[property=product:brand]
     */
    private void enrichBrand(Document doc, Product p) {
        // 1. Schema.org brand
        Element brandSchema = doc.selectFirst("[itemprop=brand]");
        if (brandSchema != null) {
            String brand = brandSchema.text().trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
                return;
            }
        }

        // 2. Manufacturer blok
        Element mfgLink = doc.selectFirst("div.product-manufacturer a");
        if (mfgLink != null) {
            String brand = mfgLink.text().trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
                return;
            }
        }

        Element mfgImg = doc.selectFirst("div.product-manufacturer img");
        if (mfgImg != null) {
            String brand = mfgImg.attr("alt").trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
                return;
            }
        }

        // 3. Meta tag
        Element meta = doc.selectFirst("meta[property=product:brand]");
        if (meta != null) {
            String brand = meta.attr("content").trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
            }
        }
    }

    /**
     * Ukusi iz radio button grupe.
     * HTML struktura:
     *   <ul id="group_4">
     *     <li class="input-container">
     *       <label>
     *         <input type="radio" title="Jaffa">
     *         <span class="radio-label">Jaffa</span>
     *       </label>
     *     </li>
     *   </ul>
     */
    private void enrichFlavours(Document doc, Product p) {
        // Traži div.product-variants sa labelom koja sadrži "UKUS"
        Element variantsDiv = doc.selectFirst("div.product-variants");
        if (variantsDiv == null) return;

        Elements labels = variantsDiv.select("span.control-label");
        for (Element label : labels) {
            String labelText = label.text().toLowerCase();
            if (labelText.contains("ukus") || labelText.contains("flavor")) {
                // Našli smo ukus sekciju, izvuci radio opcije
                Element parent = label.parent();
                if (parent != null) {
                    Elements radioLabels = parent.select("span.radio-label");
                    for (Element radioLabel : radioLabels) {
                        String flavour = radioLabel.text().trim();
                        if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                            p.getFlavours().add(flavour);
                        }
                    }
                }
                return;
            }
        }

        // Fallback: traži direktno ul#group_X koje ima radio inputs
        Elements radioInputs = doc.select("input.input-radio[type=radio]");
        for (Element input : radioInputs) {
            String title = input.attr("title").trim();
            if (!title.isBlank() && !p.getFlavours().contains(title)) {
                p.getFlavours().add(title);
            }
        }
    }

    /**
     * Opis sa PrestaShop detaljne strane.
     */
    private void enrichDescription(Document doc, Product p) {
        // PrestaShop short description
        Element shortDesc = doc.selectFirst("div.product-description-short");
        if (shortDesc != null) {
            String text = shortDesc.text().trim();
            if (!text.isBlank()) {
                p.setDescription(text);
                return;
            }
        }

        // Full description tab
        Element fullDesc = doc.selectFirst("div#description div.product-description");
        if (fullDesc != null) {
            String text = fullDesc.text().trim();
            if (!text.isBlank()) {
                p.setDescription(text);
            }
        }
    }

    /**
     * Protein na 100g.
     *
     * OGISTRA PROBLEM: nutritivna tabela često nema "100g" kolonu,
     * već samo "Količina" što je per-serving.
     *
     * Strategija:
     *   1. Traži tabelu sa eksplicitnom "100g" kolonom
     *   2. Fallback: NutritionParserService nad opisom
     */
    private void enrichProteinPer100g(Document doc, Product p) {
        // 1. Pokušaj iz tabele
        Double protein = extractProteinFromTable(doc);
        if (protein != null) {
            p.setProteinPer100g(protein);
            log.info("[{}] '{}' -> protein: {}g/100g (from table)",
                    STORE_NAME, p.getName(), protein);
            return;
        }

        // 2. Fallback: NutritionParserService
        String allText = "";

        Element fullDesc = doc.selectFirst("div#description");
        if (fullDesc != null) {
            allText = fullDesc.text();
        }

        if (allText.isBlank() && p.getDescription() != null) {
            allText = p.getDescription();
        }

        if (!allText.isBlank()) {
            protein = nutritionParser.extractProteinPer100g(allText);
            if (protein != null) {
                p.setProteinPer100g(protein);
                log.info("[{}] '{}' -> protein: {}g/100g (from description)",
                        STORE_NAME, p.getName(), protein);
                return;
            }
        }

        log.warn("[{}] '{}' -> protein per 100g not found", STORE_NAME, p.getName());
    }

    /**
     * Parsira nutritivnu tabelu SAMO ako ima eksplicitnu "100g" kolonu.
     */


    private Double extractProteinFromTable(Document doc) {
        Elements tables = doc.select("table");

        for (Element table : tables) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini")
                    && !tableText.contains("belančevine")
                    && !tableText.contains("protein")) {
                continue;
            }

            try {
                // 1. Traži header koji sadrži "po porciji (Xg)" ili "per serving"
                Double servingSizeGrams = null;

                // Proveri heading iznad tabele
                Element prevHeading = table.previousElementSibling();
                while (prevHeading != null && servingSizeGrams == null) {
                    String headingText = prevHeading.text();
                    servingSizeGrams = extractServingSize(headingText);
                    if (servingSizeGrams != null) break;
                    prevHeading = prevHeading.previousElementSibling();
                }

                // Fallback: proveri caption ili thead
                if (servingSizeGrams == null) {
                    Element caption = table.selectFirst("caption");
                    if (caption != null) {
                        servingSizeGrams = extractServingSize(caption.text());
                    }
                }

                if (servingSizeGrams == null) {
                    Element thead = table.selectFirst("thead");
                    if (thead != null) {
                        servingSizeGrams = extractServingSize(thead.text());
                    }
                }

                // Ako nismo našli serving size, možda ima "100g" kolonu — pokušaj staru logiku
                if (servingSizeGrams == null) {
                    Double per100g = extractFromStandardTable(table);
                    if (per100g != null) return per100g;
                    continue;
                }

                // 2. Izvuci protein vrednost iz "Količina" kolone
                Elements rows = table.select("tr");
                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() < 2) continue;

                    String label = cells.get(0).text().trim().toLowerCase();
                    boolean isProteinRow = (label.contains("proteini")
                            || label.contains("belančevine")
                            || label.equals("protein"))
                            && !label.contains("koncentrat")
                            && !label.contains("izvor")
                            && !label.contains("preparat");

                    if (isProteinRow) {
                        String valText = cells.get(1).text()
                                .replaceAll("[^0-9,.]", "")
                                .replace(",", ".")
                                .trim();

                        if (!valText.isBlank()) {
                            double proteinPerServing = Double.parseDouble(valText);

                            // 3. Preračunaj na 100g
                            double proteinPer100g = (proteinPerServing / servingSizeGrams) * 100.0;

                            if (proteinPer100g > 0 && proteinPer100g <= 100) {
                                log.info("[{}] Calculated from serving: {}g per {}g → {}g/100g",
                                        STORE_NAME, proteinPerServing, servingSizeGrams,
                                        Math.round(proteinPer100g * 10) / 10.0);
                                return Math.round(proteinPer100g * 10) / 10.0; // Zaokruži na 1 decimalu
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("[{}] Failed to parse table: {}", STORE_NAME, e.getMessage());
            }
        }

        return null;
    }
    private Double extractServingSize(String text) {
        if (text == null) return null;

        // Pattern: "po porciji (28 g)", "per serving (30g)", "(25g)", etc.
        Pattern pattern = Pattern.compile(
                "\\(\\s*(\\d+[.,]?\\d*)\\s*g\\s*\\)|" +  // (28 g) ili (28g)
                        "porcij[ia].*?(\\d+[.,]?\\d*)\\s*g|" +   // porciji 28 g
                        "serving.*?(\\d+[.,]?\\d*)\\s*g",         // serving 28 g
                Pattern.CASE_INSENSITIVE
        );

        Matcher m = pattern.matcher(text);
        if (m.find()) {
            for (int i = 1; i <= m.groupCount(); i++) {
                String match = m.group(i);
                if (match != null && !match.isBlank()) {
                    try {
                        return Double.parseDouble(match.replace(",", "."));
                    } catch (Exception ignored) {}
                }
            }
        }

        return null;
    }
    private Double extractFromStandardTable(Element table) {
        try {
            Elements rows = table.select("tr");
            if (rows.isEmpty()) return null;

            // Detektuj "100g" kolonu iz header reda
            int per100gCol = -1;
            Elements headerCells = rows.get(0).select("th, td");
            for (int i = 0; i < headerCells.size(); i++) {
                String cellText = headerCells.get(i).text()
                        .toLowerCase()
                        .replaceAll("\\s+", "");
                if (cellText.contains("100g") || cellText.contains("100gr")) {
                    per100gCol = i;
                    break;
                }
            }

            if (per100gCol < 1) return null;

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
        } catch (Exception e) {
            log.warn("[{}] Failed to parse standard table: {}", STORE_NAME, e.getMessage());
        }

        return null;
    }

    // -------------------- Helpers --------------------

    private void safeSleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}