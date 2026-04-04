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
import org.jsoup.safety.Safelist;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProteiniSiScraper implements StoreScraper{

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
        if (page != null) {
            enrichWithFlavours(page, products);
        } else {
            log.info("[{}] Skipping enrichment (page is null) - returning basic product data.", STORE_NAME);
        }

        return products;
    }
    public void enrichWithFlavours(Page page, List<Product> products) {
        int count = 0;
        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            try {
                page.navigate(p.getUrl(), new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED));
                page.click("li.description_tab a");
                page.waitForSelector("div#tab-description",
                        new Page.WaitForSelectorOptions().setTimeout(5000));


                Document doc = Jsoup.parse(page.content());
                enrichWithVariations(doc, p);

                count++;

                if (count % 20 == 0) {
                    log.info("[{}] Batch of 20 done, sleeping 30s...", STORE_NAME);
                    Thread.sleep(30_000);
                } else {
                    Thread.sleep(2000 + (long)(Math.random() * 2000));
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich product {}: {}", STORE_NAME, p.getName(), e.getMessage());
            }
        }
    }
    private void enrichWithVariations(Document doc, Product p) {
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

                if (!flavour.isBlank()){
                    String normalized = normalizeFlavour(flavour);
                    if (!p.getFlavours().contains(normalized)) {
                        p.getFlavours().add(normalized);
                    }

                }
            }


            Element descriptionEl = doc.selectFirst("div#tab-description div.ckeditor");
            if (descriptionEl != null) {
                String cleanDescription = HtmlCleaner.cleanDescription(descriptionEl.html());
                p.setDescription(cleanDescription);

            }

            log.info("[{}] Enriched '{}' — flavours: {}, description: {}chars",
                    STORE_NAME, p.getName(), p.getFlavours(),
                    p.getDescription() != null ? p.getDescription().length() : 0);

        } catch (Exception e) {
            log.warn("[{}] Failed to parse variations for {}: {}", STORE_NAME, p.getName(), e.getMessage());
        }
    }

    private Product parseElement(Element el) {
        try {
            Product p = new Product();
            Element title = el.selectFirst("h3.wd-entities-title a");
            p.setName(title != null ? title.text().trim() : "");
            p.setUrl(title != null ? title.attr("href") : "");

            Element img = el.selectFirst("div.product-element-top img");
            p.setImageUrl(img != null ? img.attr("src") : "");

            Element price = el.selectFirst("span.woocommerce-Price-amount bdi");
            if (price != null) {
                p.setPrice(price.text()
                        .replace("\u00a0", "")
                        .replace("RSD", "")
                        .trim());
            }


            Element gtm = el.selectFirst("span.gtm4wp_productdata");
            if (gtm != null) {
                parseGtmData(gtm.attr("data-gtm4wp_product_data"), p);
            }


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

       //     String brand = data.path("item_brand").asText("");
         //   if (!brand.isBlank()) p.setBrand(brand);

//            String category = data.path("item_category").asText("");
//            if (!category.isBlank()) p.setCategory(category);
//
//            boolean inStock = "instock".equals(data.path("stockstatus").asText());
//            p.setInStock(inStock);

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
            p.getPackage_weight().add(matcher.group().trim());
        }
    }


    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;

        String firstName = p.getName().split(" ")[0].trim();
        p.setBrand(firstName);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("a.next.page-numbers") != null;
    }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "page/" + page + "/";
    }

    private String normalizeFlavour(String flavour) {
        return FLAVOUR_MAP.getOrDefault(flavour.toLowerCase(), flavour);
    }
}
