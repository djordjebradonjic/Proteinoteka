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

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScraperService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final List<StoreScraper> scrapers; // Spring injektuje sve implementacije

    private static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );
    public List<Product> scrapeAll() {
        List<Product> allProducts = new ArrayList<>();

        for (StoreScraper scraper : scrapers) {
            allProducts.addAll(scrapeStore(scraper));
        }

        return allProducts;
    }

    public List<Product> scrapeStore(StoreScraper scraper) {

        Store store = storeRepository.findByName(scraper.getStoreName())
                .orElseThrow(() -> new RuntimeException("Store not found"));

        List<Product> products = new ArrayList<>();

        try (Playwright playwright = Playwright.create()) {

            Browser browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions().setHeadless(true)
            );

            String randomUA = USER_AGENTS.get(java.util.concurrent.ThreadLocalRandom.current().nextInt(USER_AGENTS.size()));

            BrowserContext context = browser.newContext(
                    new Browser.NewContextOptions()
                            .setUserAgent("Mozilla/5.0")
            );

            Page page = context.newPage();

            int currentPage = 0;
            boolean hasNext = true;

            while (hasNext) {

                long sleepTime = java.util.concurrent.ThreadLocalRandom.current().nextLong(3000, 6000);
                log.info("Waiting {}ms before next page...", sleepTime);
                Thread.sleep(sleepTime);

                String url = scraper.buildPageUrl(currentPage);
                log.info("Scraping {} page {}", scraper.getStoreName(), url);

                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.NETWORKIDLE));

                page.mouse().wheel(0, 500);
                Thread.sleep(500); // Imitate mouse movement
                page.mouse().wheel(0, -200);

                String html = page.content();
                Document doc = Jsoup.parse(html);

                List<Product> pageProducts = scraper.scrape(page, doc);

                pageProducts.forEach(p -> p.setStore(store));
                products.addAll(pageProducts);

                hasNext = scraper.hasNextPage(doc);
                currentPage++;

                if (currentPage > 50) break;
            }

            productRepository.saveAll(products);
            browser.close();

        } catch (Exception e) {
            log.error("Error scraping {}: ", scraper.getStoreName(), e);
        }

        return products;
    }

}