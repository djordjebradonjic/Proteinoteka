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
public class SupplementShopScraper implements StoreScraper {

    private static final String STORE_NAME = "Supplementshop";
    private static final String BASE_URL = "https://supplementshop.rs/kategorija-proizvoda/proteini/";

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
        log.info("[{}] Found {} products on listing page", STORE_NAME, elements.size());

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
        }

        return products;
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element el) {
        try {
            Product p = new Product();

            // 1. Naziv i URL
            Element titleLink = el.selectFirst("h3.wd-entities-title a");
            if (titleLink == null) return null;
            p.setName(titleLink.text().trim());
            p.setUrl(titleLink.attr("href"));

            // 2. Slika (sa fallback na srcset za lazy-loaded slike)
            Element imgEl = el.selectFirst(".product-image-link img");
            if (imgEl != null) {
                String imgUrl = imgEl.attr("src");

                // Fallback za lazy-loaded slike (src = data:image placeholder)
                if (imgUrl.isEmpty() || imgUrl.startsWith("data:")) {
                    String srcset = imgEl.attr("srcset");
                    if (!srcset.isEmpty()) {
                        // Uzmi poslednji (najveci) iz srcset-a
                        String[] parts = srcset.split(",");
                        imgUrl = parts[parts.length - 1].trim().split("\\s+")[0];
                    }
                }

                // Neki Woodmart sajtovi koriste data-src za lazy load
                if (imgUrl.isEmpty() || imgUrl.startsWith("data:")) {
                    imgUrl = imgEl.attr("data-src");
                }

                p.setImageUrl(imgUrl);
            }

            // 3. Cena: "2.290,00 rsd" — case insensitive replace
            Element priceEl = el.selectFirst("span.woocommerce-Price-amount bdi");
            if (priceEl != null) {
                p.setPrice(priceEl.text()
                        .replace("\u00a0", "")
                        .replaceAll("(?i)rsd", "")
                        .trim());
            }

            // 4. Brend fallback sa listinga (prva kategorija je obicno brend)
            Element brandCat = el.selectFirst("div.wd-product-cats a");
            if (brandCat != null) {
                p.setBrand(brandCat.text().trim());
            }

            // 5. Ukusi sa listinga iz swatch-ova (Woodmart prikazuje ih na grid-u)
            Elements swatches = el.select("div.wd-swatches-grid span.wd-swatch-text");
            for (Element swatch : swatches) {
                String flavour = swatch.text().trim();
                if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                    p.getFlavours().add(flavour);
                }
            }

            // 6. Tezina iz naziva kao fallback
            extractPackageWeightFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
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
                // 1. Anti-ban pauza pre navigacije
                Thread.sleep(ThreadLocalRandom.current().nextLong(2000, 4500));

                // 2. Navigacija
                page.navigate(p.getUrl(), new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.NETWORKIDLE));

                // 3. Firewall detekcija posle navigacije
                if (isBlocked(page)) {
                    log.error("[{}] DETECTED BY FIREWALL on {}! Stopping scraper.",
                            STORE_NAME, p.getUrl());
                    return;
                }

                // 4. Simulacija ljudskog ponasanja
                simulateHumanActivity(page);

                Document doc = Jsoup.parse(page.content());

                // 5. Enrichment
                enrichBrand(doc, p);
                enrichPackageWeights(doc, p);
                enrichFlavours(doc, p);
                enrichDescription(doc, p);
                enrichProteinPer100g(doc, p);

                // NE racunamo valueScore/numericPrice ovde —
                // ScraperService.saveOrUpdateProduct to radi sa ispravnom formulom

                log.info("[{}] Enriched '{}' -> brand={}, weights={}, flavours={}, protein={}",
                        STORE_NAME, p.getName(), p.getBrand(),
                        p.getPackage_weight(), p.getFlavours(), p.getProteinPer100g());

                count++;

                // 6. Dinamicki batching
                if (count % 15 == 0) {
                    long longSleep = ThreadLocalRandom.current().nextLong(45000, 65000);
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

    // -------------------- Enrichment metode --------------------

    /**
     * Brend iz Woodmart brand widgeta na detalj strani.
     * Primarno: img alt atribut iz div.wd-product-brands
     * Fallback: link ka /prodavnica/?filter_brand=xyz
     */
    private void enrichBrand(Document doc, Product p) {
        Element brandImg = doc.selectFirst("div.wd-product-brands img");
        if (brandImg != null) {
            String brand = brandImg.attr("alt").trim();
            if (!brand.isBlank()) {
                p.setBrand(brand);
                return;
            }
        }

        Element brandLink = doc.selectFirst("div.wd-product-brands a");
        if (brandLink != null) {
            String href = brandLink.attr("href");
            if (href.contains("filter_brand=")) {
                String slug = href.substring(href.indexOf("filter_brand=") + 13);
                slug = slug.replace("-", " ").trim();
                if (!slug.isBlank()) {
                    String[] words = slug.split("\\s+");
                    StringBuilder brand = new StringBuilder();
                    for (String word : words) {
                        if (!word.isEmpty()) {
                            brand.append(Character.toUpperCase(word.charAt(0)))
                                    .append(word.substring(1))
                                    .append(" ");
                        }
                    }
                    p.setBrand(brand.toString().trim());
                }
            }
        }
    }

    /**
     * Pakovanja iz WooCommerce select-a.
     * Fallback: Woodmart attributes tabela (table.shop_attributes).
     */
    private void enrichPackageWeights(Document doc, Product p) {
        // Primarno: select opcije
        Elements options = doc.select("select[name=attribute_pa_pakovanje] option");
        List<String> weights = new ArrayList<>();
        for (Element opt : options) {
            if (opt.attr("value").isBlank()) continue;
            String weight = opt.text().trim().replaceAll("\\s+", "");
            if (!weight.isBlank() && !weights.contains(weight)) {
                weights.add(weight);
            }
        }

        // Fallback: attributes tabela
        if (weights.isEmpty()) {
            Element packRow = doc.selectFirst(
                    "tr.woocommerce-product-attributes-item--attribute_pa_pakovanje td");
            if (packRow != null) {
                Elements terms = packRow.select("span.wd-attr-term p");
                for (Element term : terms) {
                    String weight = term.text().trim().replaceAll("\\s+", "");
                    if (!weight.isBlank() && !weights.contains(weight)) {
                        weights.add(weight);
                    }
                }
            }
        }

        if (!weights.isEmpty()) {
            p.getPackage_weight().clear();
            p.getPackage_weight().addAll(weights);
        }
    }

    /**
     * Ukusi iz WooCommerce select-a.
     * Fallback: Woodmart attributes tabela.
     */
    private void enrichFlavours(Document doc, Product p) {
        Elements options = doc.select("select[name=attribute_pa_ukus] option");
        boolean found = false;
        for (Element opt : options) {
            if (opt.attr("value").isBlank()) continue;
            String flavour = opt.text().trim();
            if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                p.getFlavours().add(flavour);
                found = true;
            }
        }

        if (!found) {
            Element flavRow = doc.selectFirst(
                    "tr.woocommerce-product-attributes-item--attribute_pa_ukus td");
            if (flavRow != null) {
                Elements terms = flavRow.select("span.wd-attr-term p");
                for (Element term : terms) {
                    String flavour = term.text().trim();
                    if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                        p.getFlavours().add(flavour);
                    }
                }
            }
        }
    }

    /**
     * Opis: uzmi SAMO short description, ne ceo tab.
     * Ceo tab sadrzi i nutritivnu tabelu, FAQ, itd. sto zbunjuje
     * NutritionParserService (moze da pokupi "18g proteina po porciji"
     * umesto per-100g vrednosti).
     */
    private void enrichDescription(Document doc, Product p) {
        Element shortDesc = doc.selectFirst(
                "div.woocommerce-product-details__short-description");
        if (shortDesc != null) {
            String text = shortDesc.text().trim();
            if (!text.isBlank()) {
                p.setDescription(text);
            }
        }
    }

    /**
     * Prioritet izvora za protein na 100g:
     *   1. Nutritivna tabela iz "Opis" taba — najautoritativniji izvor
     *   2. NutritionParserService nad short description-om — fallback
     *
     * SupplementShop nema poseban "Sastav" tab; nutritivna tabela je
     * ugradjena u description tab (div#tab-description).
     */
    private void enrichProteinPer100g(Document doc, Product p) {
        Double protein = extractProteinFromTable(doc);
        if (protein != null) {
            p.setProteinPer100g(protein);
            log.info("[{}] '{}' -> protein: {}g/100g (from table)",
                    STORE_NAME, p.getName(), protein);
            return;
        }

        if (p.getDescription() != null && !p.getDescription().isBlank()) {
            protein = nutritionParser.extractProteinPer100g(p.getDescription());
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
     * Parsira nutritivnu tabelu iz Opis taba.
     *
     * Struktura na supplementshop.rs:
     *   | Energetske vrednost... | 100 g    | 1 porcija (25 g) |
     *   | Proteini               | 72 g     | 18,0 g           |
     *
     * KLJUCNO: ne hardkodujemo indeks kolone! Prolazimo header red
     * i trazimo celiju koja sadrzi "100g" — tek onda znamo iz koje
     * kolone da citamo protein vrednost.
     */
    private Double extractProteinFromTable(Document doc) {
        Element descTab = doc.selectFirst("div#tab-description");
        if (descTab == null) {
            descTab = doc.selectFirst("div.woocommerce-Tabs-panel--description");
        }
        if (descTab == null) return null;

        Elements tables = descTab.select("table");
        if (tables.isEmpty()) return null;

        for (Element table : tables) {
            String tableText = table.text().toLowerCase();
            if (!tableText.contains("proteini") && !tableText.contains("belančevine")) {
                continue;
            }

            try {
                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // 1. Detektuj indeks "100g" kolone iz header reda
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

                if (per100gCol < 1) {
                    log.warn("[{}] Table found but '100g' column not in header", STORE_NAME);
                    continue;
                }

                // 2. Nadji red sa proteinima i izvuci vrednost iz detektovane kolone
                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase();

                    boolean isProteinRow = (label.contains("proteini")
                            || label.contains("belančevine"))
                            && !label.contains("koncentrat")
                            && !label.contains("preparat")
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
                log.warn("[{}] Failed to parse table: {}", STORE_NAME, e.getMessage());
            }
        }

        return null;
    }

    // -------------------- Pomocne metode --------------------

    private boolean isBlocked(Page page) {
        String title = page.title();
        return title.contains("Cloudflare")
                || title.contains("Attention Required")
                || title.contains("Just a moment");
    }

    private void simulateHumanActivity(Page page) {
        try {
            page.mouse().wheel(0, ThreadLocalRandom.current().nextInt(300, 600));
            page.waitForTimeout(ThreadLocalRandom.current().nextInt(1000, 2000));
        } catch (Exception ignored) {}
    }

    private void safeSleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}