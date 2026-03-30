package com.proteinoteka.service;

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

@Component
@Slf4j
@RequiredArgsConstructor
public class PansportScraper implements StoreScraper {

        @Override
        public String getStoreName() {
            return "Pansport";
        }

        @Override
        public String getBaseUrl() {
            return "https://www.pansport.rs/proteini/koncentrati-koncentrati-izolati-proteina-surutke-whey";
        }

        @Override
        public List<Product> scrape(Page page, Document doc) {
            List<Product> products = new ArrayList<>();

            Elements elements = doc.select("div.product-teaser");

            for (Element el : elements) {
                Product p = parseProductElement(el);
                if (p != null) {
                    products.add(p);
                }
            }

            return products;
        }

        @Override
        public boolean hasNextPage(Document doc) {
            return doc.selectFirst("li.pager__item--next a") != null;
        }

        @Override
        public String buildPageUrl(int page) {
            return page == 0 ? getBaseUrl() : getBaseUrl() + "?page=" + page;
        }

        private Product parseProductElement(Element element) {
            Product p = new Product();

            Element title = element.selectFirst("h4.node__title a");
            p.setName(title != null ? title.text().trim() : "");

            Element img = element.selectFirst("div.teaser-image img");
            p.setImageUrl(img != null ? img.attr("src") : "");

            Element description = element.selectFirst("div.field__item");
            p.setDescription(description != null ? description.text().trim() : "");

            element.select("select[id^=edit-attributes-field-attr-pakovanje] option")
                    .forEach(opt -> p.getPackage_weight().add(opt.text().trim()));

            element.select("select[id^=edit-attributes-field-attr-ukus] option")
                    .forEach(opt -> p.getFlavours().add(opt.text().trim()));

            Element priceEl = element.selectFirst("td.price-amount");
            if (priceEl != null) {
                String price = priceEl.text()
                        .replace("\u00a0", "")
                        .replace("RSD", "")
                        .trim();
                p.setPrice(price);
            }

            Element link = element.selectFirst("div.details a");
            p.setUrl(link != null ? "https://www.pansport.rs" + link.attr("href") : "");

            return p;
        }
}

