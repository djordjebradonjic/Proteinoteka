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

    /**
     * Scrape sve prodavnice redosledom.
     * Stavlja 30s pauzu između store-ova.
     */
    public List<Product> scrapeAll() {
        List<Product> allProducts = new ArrayList<>();

        for (StoreScraper scraper : scrapers) {
            try {
                log.info("========== Starting scrape for {} ==========", scraper.getStoreName());
                List<Product> storeProducts = scrapeStore(scraper);
                allProducts.addAll(storeProducts);
                log.info("========== Finished scrape for {} ({} products) ==========",
                        scraper.getStoreName(), storeProducts.size());

                // Pauza između store-ova
                Thread.sleep(30_000);
            } catch (Exception e) {
                log.error("Failed to scrape {}: {}", scraper.getStoreName(), e.getMessage(), e);
            }
        }

        return allProducts;
    }

    /**
     * Scrape jednu prodavnicu sa kompletnom anti-ban zaštitom.
     */
    public List<Product> scrapeStore(StoreScraper scraper) {
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

                    // Blokiraj SAMO slike (ne CSS/fonts)
                    page.route("**/*.{png,jpg,jpeg,gif,svg,webp}", route -> route.abort());

                    int currentPage = 0;

                    while (true) {
                        // Human-like delay između stranica
                        long delay = humanDelay();
                        log.info("[{}] Waiting {}ms before next page...", scraper.getStoreName(), delay);
                        Thread.sleep(delay);

                        String url = scraper.buildPageUrl(currentPage);
                        log.info("[{}] Scraping page {}: {}", scraper.getStoreName(), currentPage, url);

                        // Navigacija sa retry logikom
                        if (!navigateWithRetry(page, url, 3)) {
                            log.error("[{}] Failed to load page after retries, stopping scraper",
                                    scraper.getStoreName());
                            break;
                        }

                        // Firewall detekcija
                        if (isBlockedByFirewall(page)) {
                            log.error("[{}] FIREWALL DETECTED! Stopping scraper.", scraper.getStoreName());
                            break;
                        }

                        // Simulacija ljudskog ponašanja
                        simulateHumanScroll(page);

                        // Parsiranje
                        Document doc = Jsoup.parse(page.content());
                        List<Product> pageProducts = scraper.scrape(page, doc);

                        log.info("[{}] Found {} products on page {}",
                                scraper.getStoreName(), pageProducts.size(), currentPage);

                        // Sačuvaj proizvode
                        for (Product p : pageProducts) {
                            p.setStore(store);
                            saveOrUpdateProduct(p, store);
                            products.add(p);
                        }

                        // Proveri da li ima sledeća stranica
                        if (!scraper.hasNextPage(doc)) {
                            log.info("[{}] No more pages found", scraper.getStoreName());
                            break;
                        }

                        currentPage++;

                        // Sigurnosna mreža
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

    // -------------------- ANTI-BAN HELPERS --------------------


    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));

                // Random wait posle učitavanja
                page.waitForTimeout(500 + (int) (Math.random() * 1000));
                return true;

            } catch (Exception e) {
                log.warn("Navigate retry {}/{} for {}: {}", i + 1, maxRetries, url, e.getMessage());
                try {
                    Thread.sleep(2000 * (i + 1)); // Exponential backoff
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
        } catch (Exception ignored) {
        }
    }


    private long humanDelay() {
        // Log-normal: medijana ~4s, range 1-20s
        double base = Math.exp(
                ThreadLocalRandom.current().nextGaussian() * 0.6 + 1.4
        );
        return (long) (base * 1000);
    }

    /**
     * Random User-Agent iz pool-a.
     */
    private String getRandomUserAgent() {
        return USER_AGENTS.get(
                ThreadLocalRandom.current().nextInt(USER_AGENTS.size())
        );
    }


    @Transactional
    private void saveOrUpdateProduct(Product scrapedProduct, Store store) {
        Optional<Product> existingOpt = productRepository.findByUrl(scrapedProduct.getUrl());

        Double numericPrice = priceParser.parse(scrapedProduct.getPrice());
        Double valueScore = calculateValueScore(numericPrice, scrapedProduct);

        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            String oldPrice = existing.getPrice();
            String newPrice = scrapedProduct.getPrice();

            // Price change tracking
            if (!oldPrice.equals(newPrice)) {
                log.info("[{}] Price change for '{}': {} -> {}",
                        store.getName(), existing.getName(), oldPrice, newPrice);

                PriceHistory history = new PriceHistory();
                history.setProduct(existing);
                history.setPrice(oldPrice);
                history.setTimestamp(java.time.LocalDateTime.now());
                priceHistoryRepository.save(history);

                existing.setPrice(newPrice);
                existing.setLastUpdated(java.time.LocalDateTime.now());
            }

            // Update fields
            existing.setNumericPrice(numericPrice);
            existing.setBrand(scrapedProduct.getBrand());
            existing.setFlavours(scrapedProduct.getFlavours());
            existing.setPackage_weight(scrapedProduct.getPackage_weight());
            existing.setName(scrapedProduct.getName());
            existing.setProteinPer100g(scrapedProduct.getProteinPer100g());
            existing.setValueScore(valueScore);
            existing.setImageUrl(scrapedProduct.getImageUrl());
            existing.setDescription(scrapedProduct.getDescription());

            productRepository.save(existing);

        } else {
            // Novi proizvod
            scrapedProduct.setStore(store);
            scrapedProduct.setNumericPrice(numericPrice);
            scrapedProduct.setValueScore(valueScore);
            productRepository.save(scrapedProduct);

            log.info("[{}] New product saved: '{}'", store.getName(), scrapedProduct.getName());
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
        double rounded = Math.round(score * 100.0) / 100.0;

        log.debug("ValueScore for '{}': {}g package, {}g/100g protein, {}RSD → {} RSD/g protein",
                p.getName(), packageGrams, p.getProteinPer100g(), numericPrice, rounded);

        return rounded;
    }


    private double extractPackageGrams(Product p) {
        if (p.getPackage_weight() == null || p.getPackage_weight().isEmpty()) return 0;

        String weight = p.getPackage_weight().get(0)
                .toLowerCase()
                .replaceAll("\\s+", "");

        try {
            if (weight.contains("kg")) {
                double kg = Double.parseDouble(
                        weight.replace("kg", "").replace(",", ".")
                );
                return kg * 1000;
            } else if (weight.contains("g")) {
                return Double.parseDouble(
                        weight.replace("g", "").replace(",", ".")
                );
            }
        } catch (Exception e) {
            log.warn("Cannot parse package weight: '{}'", weight);
        }

        return 0;
    }
}