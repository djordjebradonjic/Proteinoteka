package com.proteinoteka.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.PriceHistoryRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.StoreRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScraperService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final List<StoreScraper> scrapers; // Spring injects all implementations
    private final PriceHistoryRepository priceHistoryRepository;

    private static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    );
    public List<Product> scrapeAll() {
        List<Product> allProducts = new ArrayList<>();

        for (StoreScraper scraper : scrapers) {
            allProducts.addAll(scrapeStore(scraper));
            try {

                Thread.sleep(30_000);
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
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

                long sleepTime = java.util.concurrent.ThreadLocalRandom.current().nextLong(6000, 10000);
                log.info("Waiting {}ms before next page...", sleepTime);
                Thread.sleep(sleepTime);

                String url = scraper.buildPageUrl(currentPage);
                log.info("Scraping {} page {}", scraper.getStoreName(), url);

                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.NETWORKIDLE));

                page.mouse().wheel(0, 500);
                Thread.sleep(800); // Imitate mouse movement
                page.mouse().wheel(0, -200);

                simulateHumanScroll(page);

                String html = page.content();
                Document doc = Jsoup.parse(html);

                List<Product> pageProducts = scraper.scrape(page, doc);

                pageProducts.forEach(p -> p.setStore(store));
                products.addAll(pageProducts);

                hasNext = scraper.hasNextPage(doc);
                currentPage++;

                if (currentPage > 50) break;
                for (Product p : pageProducts) {
                    saveOrUpdateProduct(p, store);
                }
            }


            browser.close();

        } catch (Exception e) {
            log.error("Error scraping {}: ", scraper.getStoreName(), e);
        }

        return products;
    }

    @Transactional
    private void saveOrUpdateProduct(Product scrapedProduct, Store store) {
        Optional<Product> existingOpt = productRepository.findByUrl(scrapedProduct.getUrl());

        Double numericPrice = parsePriceToNumeric(scrapedProduct.getPrice());

        if (existingOpt.isPresent()) {
            Product existingProduct = existingOpt.get();
            String oldPriceStr = existingProduct.getPrice();
            String newPriceStr = scrapedProduct.getPrice();

            if (!oldPriceStr.equals(newPriceStr)) {
                log.info("[{}] Price change: {}: {} -> {}",
                        store.getName(), existingProduct.getName(), oldPriceStr, newPriceStr);

                PriceHistory history = new PriceHistory();
                history.setProduct(existingProduct);
                history.setPrice(oldPriceStr);
                history.setTimestamp(java.time.LocalDateTime.now());
                priceHistoryRepository.save(history);

                existingProduct.setPrice(newPriceStr);
                existingProduct.setLastUpdated(java.time.LocalDateTime.now());
            }


            existingProduct.setNumericPrice(numericPrice);
            existingProduct.setBrand(scrapedProduct.getBrand());
            existingProduct.setFlavours(scrapedProduct.getFlavours());
            existingProduct.setPackage_weight(scrapedProduct.getPackage_weight());
            existingProduct.setName(scrapedProduct.getName());

            productRepository.save(existingProduct);

        } else {
            scrapedProduct.setStore(store);
            scrapedProduct.setNumericPrice(numericPrice);
            productRepository.save(scrapedProduct);
        }
    }
    private void simulateHumanScroll(Page page) {
        try {
            page.mouse().wheel(0, 400);
            Thread.sleep(300);
            page.mouse().wheel(0, 600);
            Thread.sleep(200);
            page.mouse().wheel(0, -300);
        } catch (Exception ignored) {}
    }

    private Double parsePriceToNumeric(String priceStr) {
        if (priceStr == null || priceStr.isEmpty()) {
            return 0.0;
        }
        try {

            String cleaned = priceStr.replaceAll("[^0-9,.]", "")
                    .replace(".", "")
                    .replace(",", ".");
            return Double.parseDouble(cleaned);
        } catch (Exception e) {
            log.warn("Price conversion failed: {} - Error: {}", priceStr, e.getMessage());
            return 0.0;
        }
    }
}