package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProteiniSiScraper implements StoreScraper{


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

        return products;
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

            return p;

        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void parseGtmData(String json, Product p) {
        try {
            JsonNode data = objectMapper.readTree(json);

            String brand = data.path("item_brand").asText("");
            if (!brand.isBlank()) p.setBrand(brand);

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
            p.getPackage_weight().add(matcher.group().trim());
        }
    }

    @Override
    public boolean hasNextPage(Document doc) {
        return doc.selectFirst("a.next.page-numbers") != null;
    }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "page/" + page + "/";
    }
}
