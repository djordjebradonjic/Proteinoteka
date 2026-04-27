package com.proteinoteka.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.BrandReputation;
import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.BrandReputationRepository;
import com.proteinoteka.repository.PriceHistoryRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.ScrapeLogRepository;
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
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    private final BrandReputationRepository brandReputationRepository;
    private final BrandNormalizerService brandNormalizer;
    private final ScrapeLogRepository scrapeLogRepository;

    @Autowired
    private NutritionParserService nutritionParser;

    @Value("${playwright.executable-path:}")
    private String playwrightExecutablePath;

    @Value("${scraping.stale.enabled:true}")
    private boolean staleEnabled;

    @Value("${scraping.stale.max-removal-percent:50}")
    private int maxRemovalPercent;

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

                if (!testMode) Thread.sleep(30_000);

            } catch (Exception e) {
                log.error("Failed to scrape {}: {}", scraper.getStoreName(), e.getMessage(), e);
            }
        }

        return allProducts;
    }

    public List<Product> scrapeAll() {
        return scrapeAll(false);
    }

    public List<Product> scrapeStore(StoreScraper scraper, boolean testMode) {
        Store store = storeRepository.findByName(scraper.getStoreName())
                .orElseThrow(() -> new RuntimeException("Store not found: " + scraper.getStoreName()));

        Set<String> existingUrlSet = new HashSet<>();
        if (staleEnabled && !testMode) {
            List<String> existingUrls = productRepository.findUrlsByStoreName(store.getName());
            existingUrlSet.addAll(existingUrls);
            log.info("[{}] Stale detection: {} existing products tracked", scraper.getStoreName(), existingUrlSet.size());
        }

        Set<String> foundUrls = new HashSet<>();
        List<Product> products = new ArrayList<>();
        boolean wasBlocked = false;

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
                            wasBlocked = true;
                            break;
                        }

                        simulateHumanScroll(page);

                        Document doc = Jsoup.parse(page.content());
                        List<Product> pageProducts = scraper.scrape(page, doc);

                        log.info("[{}] Found {} products on page {}",
                                scraper.getStoreName(), pageProducts.size(), currentPage);

                        for (Product p : pageProducts) {
                            p.setStore(store);
                            boolean saved = saveOrUpdateProduct(p, store);
                            products.add(p);
                            if (saved && p.getUrl() != null) {
                                foundUrls.add(p.getUrl());
                            }
                        }

                        if (!scraper.hasNextPage(doc)) {
                            log.info("[{}] No more pages found", scraper.getStoreName());
                            break;
                        }

                        currentPage++;

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
            wasBlocked = true;
        }

        if (staleEnabled && !testMode && !wasBlocked && !existingUrlSet.isEmpty()) {
            removeStaleProducts(store.getName(), existingUrlSet, foundUrls);
        }

        log.info("[{}] Scraping complete. Total products: {}", scraper.getStoreName(), products.size());
        return products;
    }

    public List<Product> scrapeStore(StoreScraper scraper) {
        return scrapeStore(scraper, false);
    }

    // -------------------- Stale product cleanup --------------------

    private void removeStaleProducts(String storeName, Set<String> existingUrlSet, Set<String> foundUrls) {
        if (foundUrls.isEmpty()) {
            log.warn("[{}] Stale removal skipped — scrape found 0 valid products (possible block or scrape error)", storeName);
            return;
        }

        Set<String> missingUrls = new HashSet<>(existingUrlSet);
        missingUrls.removeAll(foundUrls);

        if (missingUrls.isEmpty()) {
            log.info("[{}] No stale products detected", storeName);
            return;
        }

        double removalPercent = (double) missingUrls.size() / existingUrlSet.size() * 100;
        if (removalPercent > maxRemovalPercent) {
            log.warn("[{}] Safety check FAILED — skipping stale removal. Found: {}, Missing: {} ({}% would be removed, threshold {}%)",
                    storeName, foundUrls.size(), missingUrls.size(), (int) removalPercent, maxRemovalPercent);
            return;
        }

        log.info("[{}] Removing {} stale products ({}% of existing): {}",
                storeName, missingUrls.size(), (int) removalPercent, missingUrls);
        productRepository.deleteByUrlIn(missingUrls);

        scrapeLogRepository.findFirstByStoreNameOrderByStartedAtDesc(storeName).ifPresent(entry -> {
            entry.setProductsRemoved(missingUrls.size());
            scrapeLogRepository.save(entry);
        });

        log.info("[{}] Stale removal complete — {} products removed", storeName, missingUrls.size());
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
    public boolean saveOrUpdateProduct(Product scraped, Store store) {

        // 1. Normalizuj brend
        if (scraped.getBrand() != null) {
            scraped.setBrand(brandNormalizer.normalize(scraped.getBrand()));
        }

        // 2. Validacija nutritivnih vrednosti
        if (scraped.getProteinPer100g() != null) {
            if (scraped.getProteinPer100g() < 15 || scraped.getProteinPer100g() > 100) {
                log.warn("[{}] Invalid protein value for '{}': {}g/100g — setting null",
                        store.getName(), scraped.getName(), scraped.getProteinPer100g());
                scraped.setProteinPer100g(null);
            }
        }
        if (scraped.getSugarPer100g() != null && scraped.getSugarPer100g() > 100) {
            log.warn("[{}] Invalid sugar value for '{}': {}g/100g — setting null",
                    store.getName(), scraped.getName(), scraped.getSugarPer100g());
            scraped.setSugarPer100g(null);
        }
        if (scraped.getFatPer100g() != null && scraped.getFatPer100g() > 100) {
            log.warn("[{}] Invalid fat value for '{}': {}g/100g — setting null",
                    store.getName(), scraped.getName(), scraped.getFatPer100g());
            scraped.setFatPer100g(null);
        }
        if (scraped.getCaloriePer100g() != null && scraped.getCaloriePer100g() > 900) {
            log.warn("[{}] Invalid calorie value for '{}': {}kcal/100g — setting null",
                    store.getName(), scraped.getName(), scraped.getCaloriePer100g());
            scraped.setCaloriePer100g(null);
        }

        // 3. Validacija cene
        Double numericPrice = priceParser.parse(scraped.getPrice());
        if (numericPrice == null || numericPrice == 0) {
            log.warn("[{}] Skipping '{}' - no valid price", store.getName(), scraped.getName());
            return false;
        }

        // 4. Validacija proteina
        if (scraped.getProteinPer100g() == null || scraped.getProteinPer100g() < 15) {
            log.warn("[{}] Skipping '{}' - no valid protein data (protein={})",
                    store.getName(), scraped.getName(), scraped.getProteinPer100g());
            return false;
        }

        Optional<Product> existingOpt = productRepository.findByUrl(scraped.getUrl());
        Double valueScore = calculateValueScore(numericPrice, scraped);
        double weightGrams = extractPackageGrams(scraped);

        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();

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

            // GROUP 1 — uvek ažuriraj
            existing.setPrice(scraped.getPrice());
            existing.setNumericPrice(numericPrice);
            existing.setValueScore(valueScore);
            existing.setLastUpdated(LocalDateTime.now());

            // GROUP 2 — ažuriraj samo ako postoji nova vrednost
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

            // GROUP 3 — ažuriraj samo ako je null u bazi
            if (scraped.getProteinPer100g() != null) {
                if (existing.getProteinPer100g() == null || existing.getProteinPer100g() < 15) {
                    existing.setProteinPer100g(scraped.getProteinPer100g());
                }
            }
            if (existing.getFatPer100g() == null && scraped.getFatPer100g() != null)
                existing.setFatPer100g(scraped.getFatPer100g());
            if (existing.getSugarPer100g() == null && scraped.getSugarPer100g() != null)
                existing.setSugarPer100g(scraped.getSugarPer100g());
            if (existing.getCaloriePer100g() == null && scraped.getCaloriePer100g() != null)
                existing.setCaloriePer100g(scraped.getCaloriePer100g());
            if (existing.getProteinSource() == null && scraped.getProteinSource() != null)
                existing.setProteinSource(scraped.getProteinSource());

            productRepository.save(existing);
            return true;

        } else {
            scraped.setStore(store);
            scraped.setNumericPrice(numericPrice);
            scraped.setValueScore(valueScore);
            if (weightGrams > 0) scraped.setPrimaryWeightGrams(weightGrams);
            productRepository.save(scraped);
            log.info("[{}] New product saved: '{}'", store.getName(), scraped.getName());
            return true;
        }
    }

    // -------------------- Score calculation --------------------

    public Double calculateValueScore(Double numericPrice, Product p) {
        if (numericPrice == null || numericPrice <= 0) return null;
        if (p.getProteinPer100g() == null) return null;
        double packageGrams = extractPackageGrams(p);
        if (packageGrams <= 0) return null;

        // 1. VALUE FOR MONEY (0-10) - weight 0.40
        double proteinTotalGrams = (p.getProteinPer100g() / 100.0) * packageGrams;
        if (proteinTotalGrams <= 0) return null;
        double pricePerGramProtein = numericPrice / proteinTotalGrams;
        if (pricePerGramProtein > 50) return null;
        double benchmark = getCategoryBenchmark(p.getProteinSource());
        double ratio = pricePerGramProtein / benchmark;

        double valueMoney = 10.0 / (1.0 + Math.exp(3.5 * (ratio - 1.2)));
        valueMoney = Math.max(0, Math.min(10, valueMoney));

        // 2. PROTEIN PURITY (0-10) - weight 0.20
        double proteinPct = p.getProteinPer100g();
        double proteinPurity = 10 * Math.pow(Math.max(0, (proteinPct - 60) / 40.0), 0.7);
        proteinPurity = Math.max(0, Math.min(10, proteinPurity));

        // 3. DIGESTIBILITY (0-10) - weight 0.15
        double digestibility = 7.0;
        if (p.getProteinSource() != null) {
            String src = p.getProteinSource().toLowerCase();
            if (src.contains("hydro"))           digestibility = 10.0;
            else if (src.contains("cfm"))        digestibility = 9.7;
            else if (src.contains("isolat"))     digestibility = 9.3;
            else if (src.contains("casein"))     digestibility = 8.0;
            else if (src.contains("concentrat")) digestibility = 7.5;
            else if (src.contains("vegan"))      digestibility = 6.5;
            if (src.contains("lactose"))         digestibility = Math.min(10, digestibility + 0.3);
        }

        // 4. INGREDIENTS (0-10) - weight 0.15
        double ingredients = 10.0;
        if (p.getSugarPer100g() != null) {
            double sugar = p.getSugarPer100g();
            if (sugar > 10)     ingredients -= 3.0;
            else if (sugar > 5) ingredients -= 1.5;
        }
        if (p.getDescription() != null) {
            String desc = p.getDescription().toLowerCase();
            if (desc.contains("aspartam") || desc.contains("acesulfam"))
                ingredients -= 1.5;
            if (desc.contains("artificial") || desc.contains("color")  ||
                    desc.contains("emulsifier") || desc.contains("boja")   ||
                    desc.contains("emulgator")  || desc.contains("aroma"))
                ingredients -= 1.0;
        }
        ingredients = Math.max(0, ingredients);

        // 5. BRAND REPUTATION (0-10) - weight 0.10
        double brandScore = 4.5;
        if (p.getBrand() != null && !p.getBrand().isBlank()) {
            brandScore = brandReputationRepository
                    .findByBrandNameIgnoreCase(p.getBrand())
                    .map(BrandReputation::getScore)
                    .orElse(4.5);
        }

        // Penal: skupo + nepoznat brend
        if (brandScore < 6.0 && ratio > 1.2) {
            valueMoney *= 0.85;
        }

        // 6. CONFIDENCE PENALTY
        int missing = 0;
        if (p.getSugarPer100g() == null)  missing++;
        if (p.getFatPer100g() == null)    missing++;
        if (p.getDescription() == null || p.getDescription().isBlank()) missing++;
        if (p.getProteinSource() == null) missing++;
        double confidencePenalty = Math.max(0.84, 1.0 - (missing * 0.04));

        // FINAL SCORE
        double total =
                (0.40 * valueMoney)    +
                        (0.20 * proteinPurity) +
                        (0.15 * digestibility) +
                        (0.15 * ingredients)   +
                        (0.10 * brandScore);

        total *= confidencePenalty;

        return Math.round(total * 10.0) / 10.0;
    }

    private double getCategoryBenchmark(String proteinSource) {
        if (proteinSource == null) return 6.5;
        String src = proteinSource.toLowerCase();
        if (src.contains("hydro"))       return 6.5;
        if (src.contains("cfm"))         return 6.8;
        if (src.contains("isolat"))      return 6.8;
        if (src.contains("casein"))      return 4.9;
        if (src.contains("vegan"))       return 7.0;
        if (src.contains("blend"))       return 5.8;
        if (src.contains("concentrat"))  return 5.5;
        return 6.5;
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