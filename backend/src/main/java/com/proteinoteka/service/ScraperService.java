package com.proteinoteka.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.PriceHistoryRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.StoreRepository;
import com.proteinoteka.util.PriceParser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScraperService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final List<StoreScraper> scrapers;
    private final PriceHistoryRepository priceHistoryRepository;
    private final PriceParser priceParser;

    @Autowired
    private NutritionParserService nutritionParser;

    @Value("${playwright.executable-path:}")
    private String playwrightExecutablePath;

    private static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    );

    // -------------------- Public API --------------------

    public List<Product> scrapeAll(boolean testMode) {
        List<Product> allProducts = new ArrayList<>();

        for (StoreScraper scraper : scrapers) {
            try {
                log.info("========== Starting scrape for {} {} ==========",
                        scraper.getStoreName(), testMode ? "[TEST MODE - first page only]" : "");

                List<Product> storeProducts = scrapeStore(scraper, testMode);
                allProducts.addAll(storeProducts);

                log.info("========== Finished scrape for {} ({} products) ==========",
                        scraper.getStoreName(), storeProducts.size());

                // No pause between stores in test mode
                if (!testMode) Thread.sleep(30_000);

            } catch (Exception e) {
                log.error("Failed to scrape {}: {}", scraper.getStoreName(), e.getMessage(), e);
            }
        }

        return allProducts;
    }

    // Overload for backward compatibility
    public List<Product> scrapeAll() {
        return scrapeAll(false);
    }

    public List<Product> scrapeStore(StoreScraper scraper, boolean testMode) {
        Store store = storeRepository.findByName(scraper.getStoreName())
                .orElseThrow(() -> new RuntimeException("Store not found: " + scraper.getStoreName()));

        List<Product> products = new ArrayList<>();

        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions()
                            .setHeadless(true)
                            .setArgs(Arrays.asList(
                                    "--disable-dev-shm-usage",
                                    "--no-sandbox",
                                    "--disable-setuid-sandbox"
                            ))
            );

            try {
                String randomUA = getRandomUserAgent();
                log.info("[{}] Using User-Agent: {}", scraper.getStoreName(), randomUA);

                BrowserContext context = browser.newContext(
                        new Browser.NewContextOptions()
                                .setUserAgent(randomUA)
                                .setViewportSize(1920, 1080)
                                .setLocale("sr-RS")
                                .setTimezoneId("Europe/Belgrade")
                                .setDeviceScaleFactor(1)
                );

                try {
                    Page page = context.newPage();
                    page.route("**/*.{png,jpg,jpeg,gif,svg,webp}", route -> route.abort());

                    int currentPage = 0;

                    while (true) {
                        long delay = testMode ? 500 : humanDelay();
                        log.info("[{}] Waiting {}ms before next page...", scraper.getStoreName(), delay);
                        Thread.sleep(delay);

                        String url = scraper.buildPageUrl(currentPage);
                        log.info("[{}] Scraping page {}: {}", scraper.getStoreName(), currentPage, url);

                        if (!navigateWithRetry(page, url, 3)) {
                            log.error("[{}] Failed to load page after retries, stopping scraper",
                                    scraper.getStoreName());
                            break;
                        }

                        if (isBlockedByFirewall(page)) {
                            log.error("[{}] FIREWALL DETECTED! Stopping scraper.", scraper.getStoreName());
                            break;
                        }

                        simulateHumanScroll(page);

                        Document doc = Jsoup.parse(page.content());
                        List<Product> pageProducts = scraper.scrape(page, doc);

                        log.info("[{}] Found {} products on page {}",
                                scraper.getStoreName(), pageProducts.size(), currentPage);

                        for (Product p : pageProducts) {
                            p.setStore(store);
                            saveOrUpdateProduct(p, store);
                            products.add(p);
                        }

                        if (!scraper.hasNextPage(doc)) {
                            log.info("[{}] No more pages found", scraper.getStoreName());
                            break;
                        }

                        currentPage++;

                        // TEST MODE — stop after first page
                        if (testMode) {
                            log.info("[{}] TEST MODE: Stopping after first page", scraper.getStoreName());
                            break;
                        }

                        if (currentPage > 50) {
                            log.warn("[{}] Reached max page limit (50), stopping", scraper.getStoreName());
                            break;
                        }
                    }

                } finally {
                    context.close();
                }

            } finally {
                browser.close();
            }

        } catch (Exception e) {
            log.error("[{}] Critical error during scraping: {}", scraper.getStoreName(), e.getMessage(), e);
        }

        log.info("[{}] Scraping complete. Total products: {}", scraper.getStoreName(), products.size());
        return products;
    }

    // Overload for backward compatibility
    public List<Product> scrapeStore(StoreScraper scraper) {
        return scrapeStore(scraper, false);
    }

    // -------------------- ANTI-BAN HELPERS --------------------

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));
                page.waitForTimeout(500 + (int)(Math.random() * 1000));
                return true;
            } catch (Exception e) {
                log.warn("Navigate retry {}/{} for {}: {}", i + 1, maxRetries, url, e.getMessage());
                try {
                    Thread.sleep(2000 * (i + 1));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        return false;
    }

    private boolean isBlockedByFirewall(Page page) {
        try {
            String title = page.title();
            return title.contains("Cloudflare")
                    || title.contains("Just a moment")
                    || title.contains("Attention Required")
                    || title.contains("Access denied");
        } catch (Exception e) {
            return false;
        }
    }

    private void simulateHumanScroll(Page page) {
        try {
            page.mouse().wheel(0, 400);
            Thread.sleep(300);
            page.mouse().wheel(0, 600);
            Thread.sleep(200);
            page.mouse().wheel(0, -300);
            Thread.sleep(150);
        } catch (Exception ignored) {}
    }

    private long humanDelay() {
        double base = Math.exp(ThreadLocalRandom.current().nextGaussian() * 0.6 + 1.4);
        return (long)(base * 1000);
    }

    private String getRandomUserAgent() {
        return USER_AGENTS.get(ThreadLocalRandom.current().nextInt(USER_AGENTS.size()));
    }

    // -------------------- Save / Update --------------------

    @Transactional
    public void saveOrUpdateProduct(Product scraped, Store store) {
        Double numericPrice = priceParser.parse(scraped.getPrice());
        if (numericPrice == null || numericPrice == 0) {
            log.warn("[{}] Skipping '{}' - no valid price", store.getName(), scraped.getName());
            return;
        }
        if (scraped.getProteinPer100g() == null || scraped.getProteinPer100g() < 5) {
            log.warn("[{}] Skipping '{}' - no protein data (protein={})",
                    store.getName(), scraped.getName(), scraped.getProteinPer100g());
            return;
        }
        Optional<Product> existingOpt = productRepository.findByUrl(scraped.getUrl());

        Double valueScore = calculateValueScore(numericPrice, scraped);
        double weightGrams = extractPackageGrams(scraped);

        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();

            // Price history tracking
            String oldPrice = existing.getPrice();
            if (oldPrice != null && !oldPrice.equals(scraped.getPrice())) {
                log.info("[{}] Price change for '{}': {} -> {}",
                        store.getName(), existing.getName(), oldPrice, scraped.getPrice());
                PriceHistory history = new PriceHistory();
                history.setProduct(existing);
                history.setPrice(oldPrice);
                history.setTimestamp(LocalDateTime.now());
                priceHistoryRepository.save(history);
            }

            // GROUP 1 — Always update (changes frequently)
            existing.setPrice(scraped.getPrice());
            existing.setNumericPrice(numericPrice);
            existing.setValueScore(valueScore);
            existing.setLastUpdated(LocalDateTime.now());

            // GROUP 2 — Update only if new value exists (changes rarely)
            if (scraped.getName() != null && !scraped.getName().isBlank())
                existing.setName(scraped.getName());

            if (scraped.getBrand() != null && !scraped.getBrand().isBlank())
                existing.setBrand(scraped.getBrand());

            if (scraped.getImageUrl() != null && !scraped.getImageUrl().isBlank())
                existing.setImageUrl(scraped.getImageUrl());

            if (scraped.getDescription() != null && !scraped.getDescription().isBlank())
                existing.setDescription(scraped.getDescription());

            if (scraped.getPackage_weight() != null && !scraped.getPackage_weight().isEmpty())
                existing.setPackage_weight(scraped.getPackage_weight());

            if (scraped.getFlavours() != null && !scraped.getFlavours().isEmpty())
                existing.setFlavours(scraped.getFlavours());

            if (weightGrams > 0)
                existing.setPrimaryWeightGrams(weightGrams);

            // GROUP 3 — Update only if null in DB (never changes)
            if (existing.getProteinPer100g() == null && scraped.getProteinPer100g() != null)
                existing.setProteinPer100g(scraped.getProteinPer100g());

            if (existing.getFatPer100g() == null && scraped.getFatPer100g() != null)
                existing.setFatPer100g(scraped.getFatPer100g());

            if (existing.getSugarPer100g() == null && scraped.getSugarPer100g() != null)
                existing.setSugarPer100g(scraped.getSugarPer100g());

            if (existing.getCaloriePer100g() == null && scraped.getCaloriePer100g() != null)
                existing.setCaloriePer100g(scraped.getCaloriePer100g());

            if (existing.getProteinSource() == null && scraped.getProteinSource() != null)
                existing.setProteinSource(scraped.getProteinSource());

            productRepository.save(existing);

        } else {
            // New product
            scraped.setStore(store);
            scraped.setNumericPrice(numericPrice);
            scraped.setValueScore(valueScore);
            if (weightGrams > 0) scraped.setPrimaryWeightGrams(weightGrams);
            productRepository.save(scraped);
            log.info("[{}] New product saved: '{}'", store.getName(), scraped.getName());
        }
    }

    private Double calculateValueScore(Double numericPrice, Product p) {
        if (numericPrice == null || numericPrice == 0) return null;
        if (p.getProteinPer100g() == null) return null;
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) return null;

        double packageGrams = extractPackageGrams(p);
        if (packageGrams == 0) return null;

        double totalProteinGrams = (p.getProteinPer100g() / 100.0) * packageGrams;
        if (totalProteinGrams == 0) return null;

        double score = numericPrice / totalProteinGrams;
        return Math.round(score * 100.0) / 100.0;
    }

    private double extractPackageGrams(Product p) {
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) return 0;

        String weight = p.getPackage_weight().get(0)
                .toLowerCase()
                .replaceAll("\\s+", "");

        try {
            if (weight.contains("kg")) {
                return Double.parseDouble(weight.replace("kg", "").replace(",", ".")) * 1000;
            } else if (weight.contains("g")) {
                return Double.parseDouble(weight.replace("g", "").replace(",", "."));
            }
        } catch (Exception e) {
            log.warn("Cannot parse package weight: '{}'", weight);
        }

        return 0;
    }
}