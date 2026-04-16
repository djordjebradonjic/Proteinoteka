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

    @Override
    public String getStoreName() {
        return STORE_NAME;
    }

    @Override
    public String getBaseUrl() {
        return BASE_URL;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("li.product");
        log.info("[{}] Found {} products on page", STORE_NAME, elements.size());

        for (Element el : elements) {
            Product p = parseElement(el);
            if (p != null) {
                products.add(p);
            } else {
                log.warn("[{}] Failed to parse element, skipping", STORE_NAME);
            }
        }

        if (page != null) {
            enrichWithDetails(page, products);
        } else {
            log.info("[{}] Skipping enrichment (page is null)", STORE_NAME);
        }

        return products;
    }

    // -------------------- Detail page enrichment (SA ZAŠTITOM) --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        if (page.title().contains("Cloudflare") || page.title().contains("Attention Required")) {
            log.error("DETECTED BY FIREWALL! Stopping scraper to save IP reputation.");
            return;
        }
        int count = 0;
        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            try {
                // 1. Navigacija sa timeout-om
                page.navigate(p.getUrl(), new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED));

                // 2. Simulacija kratkog zadržavanja na strani (da ne učitaš HTML u milisekundi)
                page.waitForTimeout(500 + (Math.random() * 1000));

                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichPackageWeights(doc, p);
                enrichFlavours(doc, p);
                enrichDescription(doc, p);
                enrichProteinPer100g(doc, p);

                log.info("[{}] Enriched '{}' -> brand={}, protein={}",
                        STORE_NAME, p.getName(), p.getBrand(), p.getProteinPer100g());

                count++;

                // 3. MEHANIZAM ZA IZBEGAVANJE BANA
                if (count % 20 == 0) {
                    // Na svakih 20 proizvoda napravi dugu pauzu (kao da čovek pravi pauzu za kafu)
                    log.info("[{}] Batch of 20 done, sleeping 40s to clear rate limits...", STORE_NAME);
                    Thread.sleep(40_000);
                } else {
                    // Standardna pauza između proizvoda: 3-7 sekundi (random)
                    long sleepTime = 3000 + (long) (Math.random() * 4000);
                    Thread.sleep(sleepTime);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}", STORE_NAME, p.getName(), e.getMessage());
                // Čak i ako pukne (npr. timeout), sačekaj malo pre sledećeg URL-a
                try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
            }
        }
    }

    // -------------------- Ostale pomoćne metode --------------------

    private void enrichBrand(Document doc, Product p) {
        Element brandEl = doc.selectFirst("div.product-proizvodjaci a");
        if (brandEl != null) {
            String brand = brandEl.text().trim();
            if (!brand.isBlank()) p.setBrand(brand);
        }
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
            if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) {
                p.getFlavours().add(flavour);
            }
        }
    }

    private void enrichDescription(Document doc, Product p) {
        Element shortDesc = doc.selectFirst("div.woocommerce-product-details__short-description");
        if (shortDesc != null) {
            String text = shortDesc.text().trim();
            if (!text.isBlank()) p.setDescription(text);
        }
    }

    private void enrichProteinPer100g(Document doc, Product p) {
        Double protein = extractProteinFromIngredientsTable(doc);
        if (protein != null) {
            p.setProteinPer100g(protein);
            return;
        }

        if (p.getDescription() != null && !p.getDescription().isBlank()) {
            protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }
    }

    private Double extractProteinFromIngredientsTable(Document doc) {
        Element table = doc.selectFirst("div#sastav table");
        if (table == null) {
            for (Element t : doc.select("table")) {
                String text = t.text().toLowerCase();
                if (text.contains("100") && (text.contains("proteini") || text.contains("belančevine"))) {
                    table = t;
                    break;
                }
            }
        }
        if (table == null) return null;

        try {
            Elements rows = table.select("tr");
            int per100gColumnIndex = -1;
            Elements headerCells = rows.get(0).select("td");
            for (int i = 0; i < headerCells.size(); i++) {
                String cellText = headerCells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                if (cellText.contains("100g") || cellText.contains("100gr")) {
                    per100gColumnIndex = i;
                    break;
                }
            }

            if (per100gColumnIndex < 1) return null;

            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() <= per100gColumnIndex) continue;
                String firstCell = cells.get(0).text().trim().toLowerCase();
                if ((firstCell.contains("proteini") || firstCell.contains("belančevine"))
                        && !firstCell.contains("koncentrat")) {
                    String val = cells.get(per100gColumnIndex).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();
                    if (!val.isBlank()) return Double.parseDouble(val);
                }
            }
        } catch (Exception e) {
            log.warn("[{}] Failed to parse table: {}", STORE_NAME, e.getMessage());
        }
        return null;
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
            if (priceEl != null) {
                p.setPrice(priceEl.text().replace("\u00a0", "").replace("RSD", "").trim());
            }
            extractPackageWeightFromName(p);
            extractBrandFromName(p);
            return p;
        } catch (Exception e) {
            return null;
        }
    }

    private void extractPackageWeightFromName(Product p) {
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE).matcher(p.getName());
        while (m.find()) p.getPackage_weight().add(m.group().trim());
    }
    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        // Splituje po bilo kojoj crtici koja ima razmake oko sebe
        String[] parts = p.getName().split("\\s+[-–—]\\s+");

        if (parts.length >= 2) {
            String brand = parts[parts.length - 1].trim();
            p.setBrand(brand);
        }
    }

    @Override public boolean hasNextPage(Document doc) { return doc.selectFirst("a.next.page-numbers") != null; }
    @Override public String buildPageUrl(int page) { return page == 0 ? BASE_URL : BASE_URL + "page/" + page + "/"; }
}