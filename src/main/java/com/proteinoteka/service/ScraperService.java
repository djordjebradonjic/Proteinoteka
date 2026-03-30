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
import java.math.BigDecimal;
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
            String baseUrl = "https://www.pansport.rs/proteini/koncentrati-koncentrati-izolati-proteina-surutke-whey";

            Store pansport = storeRepository.findByName("Pansport")
                    .orElseThrow(() -> new RuntimeException("Store Pansport not found"));

            List<Product> products = new ArrayList<>();

            try (Playwright playwright = Playwright.create()) {
                Browser browser = playwright.chromium().launch(
                        new BrowserType.LaunchOptions().setHeadless(true)
                );
                BrowserContext context = browser.newContext(
                        new Browser.NewContextOptions()
                                .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                                        "Chrome/123.0.0.0 Safari/537.36")
                );

                Page page = context.newPage();
                int currentPage = 0;
                boolean hasNextPage = true;

                while (hasNextPage) {
                    String url = currentPage == 0 ? baseUrl : baseUrl + "?page=" + currentPage;
                    log.info("Scraping page: {}", url);

                    page.navigate(url, new Page.NavigateOptions()
                            .setWaitUntil(WaitUntilState.NETWORKIDLE));

                    if (page.title().contains("Bot Detection") || page.title().isBlank()) {
                        log.info("Cloudflare detected, waiting...");
                        page.waitForSelector("div.product-teaser",
                                new Page.WaitForSelectorOptions().setTimeout(20_000));
                    }

                    log.info("Page title: {}", page.title());

                    String html = page.content();
                    Document doc = Jsoup.parse(html);

                    Elements elements = doc.select("div.product-teaser");
                    log.info("Page {} — found {} products", currentPage, elements.size());

                    for (Element el : elements) {
                        Product p = parseProductElement(el.outerHtml());
                        if (p != null) {
                            p.setStore(pansport);
                            log.info("Parsed product: {}", p);
                            products.add(p);
                        } else {
                            log.warn("Failed to parse element, skipping");
                        }
                    }


                    Element nextPage = doc.selectFirst("li.pager__item--next a");
                    if (nextPage != null) {
                        currentPage++;
                    } else {
                        hasNextPage = false;
                        log.info("No more pages, stopping.");
                    }
                }

                productRepository.saveAll(products);
                log.info("Total scraped and saved: {} products", products.size());

                browser.close();

            } catch (Exception e) {
                log.error("Scraping failed: ", e);
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
        p.setImageUrl(img != null ? img.attr("src") : "");

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

        Element priceEl = element.selectFirst("td.price-amount");
        if (priceEl != null) {
            String priceText = priceEl.text()
                    .replace("\u00a0", "")  // non-breaking space
                    .replace("RSD", "")
                    .trim();
            p.setPrice(priceText);
        }
        Element link = element.selectFirst("div.details a");
        p.setUrl(link != null ? "https://www.pansport.rs" + link.attr("href") : "");

        return p;
    }


}