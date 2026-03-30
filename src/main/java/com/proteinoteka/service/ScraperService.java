package com.proteinoteka.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitUntilState;
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

        try (Playwright playwright = Playwright.create()){

            Browser browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions()
                            .setHeadless(true)
            );
            BrowserContext context = browser.newContext(
                    new Browser.NewContextOptions()
                            .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                                    "Chrome/123.0.0.0 Safari/537.36")
            );

            Page page = context.newPage();
            page.navigate(url, new Page.NavigateOptions().setWaitUntil(WaitUntilState.NETWORKIDLE));

            log.info("Page title: {}", page.title());

            // Čekaj da Cloudflare challenge prođe
            if (page.title().contains("Bot Detection") || page.title().isBlank()) {
                log.info("Cloudflare detected, waiting...");
                page.waitForSelector("div.product-teaser",
                        new Page.WaitForSelectorOptions().setTimeout(20_000));
            }

            log.info("Page title after wait: {}", page.title());

            // Uzmi HTML i parsiraj JSoupom
            String html = page.content();
            Document doc = Jsoup.parse(html);

            log.info("Page title: {}", doc.title());

            Elements elements = doc.select("div.product-teaser");

            for (Element el : elements) {
                Product p = parseProductElement(el.outerHtml());
                if (p != null) {
                    p.setStore(pansport);
                    log.info("Parsed product:{}", p);
                    products.add(p);
                }else{
                    log.warn("Failed to parse element, skipping");

                }
            }
            productRepository.saveAll(products);
            log.info("Scraped and saved {} products", products.size());
            browser.close();

        } catch (Exception e) {
            log.error("Scraping error: {}", e.getMessage());
        }
        return products;
    }
    private Product parseProductElement(String html) {

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