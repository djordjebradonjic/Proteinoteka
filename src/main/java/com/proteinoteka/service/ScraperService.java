package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScraperService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;

    public List<Product> scrapePansport() {
        String url = "https://www.pansport.rs/proteini/koncentrati-koncentrati-izolati-proteina-surutke-whey";
        Store pansport = storeRepository.findByName("Pansport").
                orElseThrow(() -> new RuntimeException("Store Pansport not found"));
        List<Product> products = new ArrayList<>();

        try {

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                            "AppleWebKit/537.36 (KHTML, like Gecko) " +
                            "Chrome/123.0.0.0 Safari/537.36")
                    .header("Accept-Language", "sr-RS,sr;q=0.9,en-US;q=0.8")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .referrer("https://www.google.com")
                    .timeout(10_000)
                    .get();

            Elements elements = doc.select("div.product-teaser");

            for (Element el : elements) {
                Product p = parseProductElement(el.outerHtml());
                if (p != null) {
                    products.add(p);
                    productRepository.save(p);
                }
            }

        } catch (IOException e) {
            log.error("Scraping error: {}", e.getMessage());
        }
        return products;
    }
    public Product parseProductElement(String html) {

        Document doc = Jsoup.parse(html);
        Element element = doc.selectFirst("div.product-teaser");
        if(element == null) return null;

        Product p = new Product();

        Element title = element.selectFirst("h4.node__title a");
        p.setName(title != null ? title.text().trim() : "");

        // to do
        Element img = element.selectFirst("div.teaser-image img");
        p.setImageUrl("");

        Element description = element.selectFirst("div.field__item");
        p.setDescription(description != null ? description.text().trim(): "");

        Elements package_weight = element.select("select[id^=edit-attributes-field-attr-pakovanje] option");
        for (Element opt : package_weight) {
            p.getPackage_weight().add(opt.text().trim());
        }

        Elements flavour = element.select("select[id^=edit-attributes-field-attr-ukus] option");
        for (Element opt : flavour) {
            p.getFlavours().add(opt.text().trim());
        }

        return p;
    }


}