package com.proteinoteka.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.Proxy;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.event.PriceDropEvent;
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
import com.proteinoteka.util.ProductLineMatcher;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScraperService {

    // Category median sugar (g/100g) derived from measured products in the catalogue.
    // Minimum FuzzySearch.tokenSetRatio score to treat a same-store/same-weight product as the
    // same physical item when both its URL and listing name changed in the same scrape pass.
    private static final int FUZZY_MATCH_THRESHOLD = 80;

    // A single listing page failing to load (Playwright timeout + JSoup fallback both
    // failing) is skipped rather than aborting the whole store run. Only this many
    // *consecutive* page failures — a much stronger signal of a real site block — stops
    // the scraper early.
    private static final int MAX_CONSECUTIVE_PAGE_FAILURES = 3;

    // Used to impute missing sugar values so the ingredients penalty is applied fairly
    // even when a product page omits nutrition details.
    private static final Map<String, Double> SUGAR_MEDIAN_BY_SOURCE = Map.of(
        "whey_concentrate", 6.3,
        "blend",            4.4,
        "whey_isolate",     1.0,
        "hydrolysate",      3.0,
        "casein",           3.0,
        "vegan",            0.2
    );

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final List<StoreScraper> scrapers;
    private final PriceHistoryRepository priceHistoryRepository;
    private final PriceParser priceParser;
    private final BrandReputationRepository brandReputationRepository;
    private final BrandNormalizerService brandNormalizer;
    private final ScrapeLogRepository scrapeLogRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final BaseScraperEnricher baseEnricher;
    private final ProductGroupService productGroupService;
    private final ProxyAwareHttpClient httpClient;

    @Autowired
    private NutritionParserService nutritionParser;

    @Value("${playwright.executable-path:}")
    private String playwrightExecutablePath;

    @Value("${playwright.proxy.enabled:false}")
    private boolean proxyEnabled;

    @Value("${playwright.proxy.host:geo.iproyal.com}")
    private String proxyHost;

    @Value("${playwright.proxy.port:12321}")
    private int proxyPort;

    @Value("${playwright.proxy.username:}")
    private String proxyUsername;

    @Value("${playwright.proxy.password:}")
    private String proxyPassword;

    @Value("${scraping.stale.enabled:true}")
    private boolean staleEnabled;

    @Value("${scraping.stale.max-removal-percent:50}")
    private int maxRemovalPercent;

    // Playwright 1.42 bundles Chromium 123 — keep UA versions close to engine to avoid sec-ch-ua mismatch.
    // No Firefox/Safari — TLS fingerprint would mismatch the Chromium engine.
    private static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
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

        // URLs whose nutrition AND description are already complete — skip detail page visit.
        // Protein products need protein+fat+sugar+calorie+proteinSource+description all filled;
        // non-protein products never get proteinSource from AI, so protein+fat+description is enough.
        // Exception: scrapers that declare skipDetailIfDescriptionExists()=true (nutrition in images)
        // skip detail fetches for any product that already has brand + description in DB.
        boolean skipByDescription = scraper.skipDetailIfDescriptionExists();
        Set<String> completeNutritionUrls = productRepository.findNutritionStatusByStoreName(store.getName())
                .stream()
                .filter(p -> {
                    boolean hasDescription = p.getDescription() != null && !p.getDescription().isBlank();
                    if (!hasDescription) return false;
                    if (skipByDescription)
                        return p.getBrand() != null && !p.getBrand().isBlank();
                    return baseEnricher.isNonProteinProduct(p.getName())
                            || (p.getSugarPer100g() != null
                                && p.getCaloriePer100g() != null && p.getCaloriePer100g() >= 200
                                && p.getProteinSource() != null);
                })
                .map(Product::getUrl)
                .collect(Collectors.toSet());
        log.info("[{}] {} products already have complete nutrition+description — detail page will be skipped",
                scraper.getStoreName(), completeNutritionUrls.size());

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
                                    "--disable-setuid-sandbox",
                                    "--disable-blink-features=AutomationControlled",
                                    "--window-size=1920,1080",
                                    "--js-flags=--max-old-space-size=128"
                            ))
            );

            try {
                String randomUA = getRandomUserAgent();
                log.info("[{}] Using User-Agent: {}", scraper.getStoreName(), randomUA);
                if (proxyEnabled) {
                    log.info("[{}] Proxy enabled: {}:{}", scraper.getStoreName(), proxyHost, proxyPort);
                }

                Browser.NewContextOptions contextOptions = new Browser.NewContextOptions()
                        .setUserAgent(randomUA)
                        .setViewportSize(1920, 1080)
                        .setLocale("sr-RS")
                        .setTimezoneId("Europe/Belgrade")
                        .setDeviceScaleFactor(1)
                        .setExtraHTTPHeaders(Map.of(
                                "Accept-Language", "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7",
                                "Accept-Encoding", "gzip, deflate, br",
                                "DNT", "1",
                                "Upgrade-Insecure-Requests", "1"
                        ));

                if (proxyEnabled && !proxyHost.isBlank()) {
                    contextOptions.setProxy(new Proxy("http://" + proxyHost + ":" + proxyPort)
                            .setUsername(proxyUsername)
                            .setPassword(proxyPassword));
                }

                BrowserContext context = browser.newContext(contextOptions);

                // Block analytics, ads, tracking, fonts, and media — only HTML+CSS+JS needed for scraping.
                // This prevents proxy bandwidth waste on third-party trackers and product images.
                context.route("**/*", route -> {
                    String url = route.request().url();
                    String type = route.request().resourceType();
                    boolean blockByType = type.equals("image") || type.equals("media")
                            || type.equals("font") || type.equals("websocket");
                    boolean blockByDomain =
                            url.contains("google-analytics.com") || url.contains("googletagmanager.com")
                            || url.contains("googlesyndication.com") || url.contains("doubleclick.net")
                            || url.contains("facebook.net") || url.contains("facebook.com/tr")
                            || url.contains("clarity.ms") || url.contains("bing.com/bat")
                            || url.contains("omnisend") || url.contains("omnisnippet")
                            || url.contains("ahrefs.com") || url.contains("grainql.com")
                            || url.contains("holest.com") || url.contains("gstatic.com")
                            || url.contains("cloudflareinsights.com");
                    if (blockByType || blockByDomain) {
                        route.abort();
                    } else {
                        route.resume();
                    }
                });

                context.addInitScript("""
                        // 1. Remove webdriver flag — primary Cloudflare check
                        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

                        // 2. Full chrome object — headless omits these by default
                        window.chrome = {
                          app: {
                            isInstalled: false,
                            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                            RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
                          },
                          runtime: {
                            OnInstalledReason: {}, OnRestartRequiredReason: {},
                            PlatformArch: {}, PlatformNaclArch: {}, PlatformOs: {}, RequestUpdateCheckStatus: {}
                          },
                          loadTimes: function() {},
                          csi: function() {}
                        };

                        // 3. Permissions — headless returns 'denied' for notifications; real browser returns 'default'
                        const _origPermQuery = window.navigator.permissions.query.bind(navigator.permissions);
                        window.navigator.permissions.query = (params) =>
                          params.name === 'notifications'
                            ? Promise.resolve({ state: Notification.permission })
                            : _origPermQuery(params);

                        // 4. Realistic plugins list (headless has none)
                        Object.defineProperty(navigator, 'plugins', {
                          get: () => {
                            const p = [
                              { name: 'Chrome PDF Plugin',  filename: 'internal-pdf-viewer',              description: 'Portable Document Format' },
                              { name: 'Chrome PDF Viewer',  filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                              { name: 'Native Client',      filename: 'internal-nacl-plugin',             description: '' }
                            ];
                            p.__proto__ = PluginArray.prototype;
                            return p;
                          }
                        });

                        // 5. Language + hardware fingerprint
                        Object.defineProperty(navigator, 'languages',          { get: () => ['sr-RS', 'sr', 'en-US', 'en'] });
                        Object.defineProperty(navigator, 'vendor',             { get: () => 'Google Inc.' });
                        Object.defineProperty(navigator, 'hardwareConcurrency',{ get: () => 8 });
                        Object.defineProperty(navigator, 'deviceMemory',       { get: () => 8 });

                        // 6. Network info — headless omits navigator.connection
                        Object.defineProperty(navigator, 'connection', {
                          get: () => ({ rtt: 50, downlink: 10, effectiveType: '4g', saveData: false })
                        });

                        // 7. Window dimensions — headless outerWidth/Height differ from viewport
                        window.outerWidth  = window.innerWidth;
                        window.outerHeight = window.innerHeight + 100;

                        // 8. WebGL renderer — headless shows SwiftShader/llvmpipe; spoof Intel
                        try {
                          const _getParam = WebGLRenderingContext.prototype.getParameter;
                          WebGLRenderingContext.prototype.getParameter = function(param) {
                            if (param === 37445) return 'Intel Inc.';
                            if (param === 37446) return 'Intel Iris OpenGL Engine';
                            return _getParam.call(this, param);
                          };
                        } catch(e) {}
                        """);

                try {
                    Page page = context.newPage();
                    try {
                        int currentPage = 0;
                        int consecutivePageFailures = 0;

                    while (true) {
                        long delay = testMode ? 500 : humanDelay();
                        log.info("[{}] Waiting {}ms before next page...", scraper.getStoreName(), delay);
                        Thread.sleep(delay);

                        String url = scraper.buildPageUrl(currentPage);
                        log.info("[{}] Scraping page {}: {}", scraper.getStoreName(), currentPage, url);

                        boolean pageLoadFailed = false;
                        if (!scraper.usePlaywrightForListing()) {
                            // Server-rendered stores (PrestaShop, Drupal, Next.js SSR) — JSoup is enough for listing.
                            // Avoids loading images/JS/tracking through proxy on listing pages.
                            try {
                                String html = httpClient.connection(url).get().html();
                                page.setContent(html);
                                log.info("[{}] JSoup listing fetch succeeded for {}", scraper.getStoreName(), url);
                            } catch (Exception jsoupEx) {
                                log.error("[{}] JSoup listing fetch failed for page {}: {}",
                                        scraper.getStoreName(), currentPage, jsoupEx.getMessage());
                                pageLoadFailed = true;
                            }
                        } else if (!navigateWithRetry(page, url, 3)) {
                            log.warn("[{}] Playwright navigation failed — trying JSoup direct fetch for {}",
                                    scraper.getStoreName(), url);
                            try {
                                String html = httpClient.connection(url).get().html();
                                page.setContent(html);
                                log.info("[{}] JSoup direct fetch succeeded for {}", scraper.getStoreName(), url);
                            } catch (Exception jsoupEx) {
                                log.error("[{}] JSoup fallback also failed for page {}: {}",
                                        scraper.getStoreName(), currentPage, jsoupEx.getMessage());
                                pageLoadFailed = true;
                            }
                        }

                        // A single page failing to load (site hiccup, transient timeout) shouldn't
                        // abort the whole run and silently truncate every page after it — that's
                        // what produced a "SUCCESS" scrape with only 54/195 products for Polleo
                        // Sport when page 5 alone timed out. Skip the bad page and keep going;
                        // only give up once several pages *in a row* fail, which is a much
                        // stronger signal of an actual site block rather than one flaky request.
                        if (pageLoadFailed) {
                            consecutivePageFailures++;
                            if (consecutivePageFailures >= MAX_CONSECUTIVE_PAGE_FAILURES) {
                                log.error("[{}] {} consecutive page failures — stopping scraper",
                                        scraper.getStoreName(), consecutivePageFailures);
                                break;
                            }
                            currentPage++;
                            continue;
                        }
                        consecutivePageFailures = 0;

                        if (isBlockedByFirewall(page)) {
                            log.warn("[{}] FIREWALL DETECTED on listing page — giving scraper waitForListing a chance to recover.", scraper.getStoreName());
                            scraper.waitForListing(page);
                            if (isBlockedByFirewall(page)) {
                                log.error("[{}] FIREWALL persists after waitForListing. Stopping scraper.", scraper.getStoreName());
                                wasBlocked = true;
                                break;
                            }
                            log.info("[{}] Firewall bypassed via waitForListing fallback.", scraper.getStoreName());
                        } else {
                            simulateHumanScroll(page);
                            scraper.waitForListing(page);
                        }

                        Document doc = Jsoup.parse(page.content());
                        List<Product> pageProducts = scraper.scrape(page, doc, completeNutritionUrls);

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
                        page.close();
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
                        .setTimeout(10000));
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
            int scrolls = 2 + ThreadLocalRandom.current().nextInt(4);
            for (int i = 0; i < scrolls; i++) {
                int delta = i == 0
                        ? 250 + ThreadLocalRandom.current().nextInt(450)
                        : (ThreadLocalRandom.current().nextBoolean() ? 1 : -1)
                          * (100 + ThreadLocalRandom.current().nextInt(550));
                page.mouse().wheel(0, delta);
                Thread.sleep(120 + ThreadLocalRandom.current().nextLong(680));
            }
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

        // 0. Provera da li je proizvod proteinski suplement
        if (baseEnricher.isNonProteinProduct(scraped.getName())) {
            log.info("[{}] Skipping '{}' - not a protein supplement", store.getName(), scraped.getName());
            return false;
        }

        // Odbaci mass gainere i snackove sa premalo proteina (gaineri, barovi, namazi)
        if (scraped.getProteinPer100g() != null && scraped.getProteinPer100g() < 25.0) {
            log.info("[{}] Skipping '{}' — protein {}g/100g too low for a protein supplement",
                    store.getName(), scraped.getName(), scraped.getProteinPer100g());
            return false;
        }

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
        double minPrice = "EUR".equals(store.getCurrency()) ? 5.0 : 1000.0;
        if (numericPrice < minPrice) {
            log.info("[{}] Skipping '{}' - price {} {} below minimum {} (likely sachet/single-serving)",
                    store.getName(), scraped.getName(), numericPrice, store.getCurrency(), minPrice);
            return false;
        }

        // 4. Lookup existing + protein fallback:
        // Ako je protein null (listing page ne sadrzi nutrition, detail page preskocen),
        // uzmi protein iz baze — cena se uvek azurira za postojece proizvode.
        Optional<Product> existingOpt = productRepository.findByUrl(scraped.getUrl());

        // Fallback: ako URL ne matchuje (SKU se promenio), traži po imenu+prodavnici+gramazi
        if (existingOpt.isEmpty() && scraped.getPrimaryWeightGrams() != null) {
            Optional<Product> byWeight = productRepository.findByNameAndStoreAndWeight(
                    scraped.getName(), store, scraped.getPrimaryWeightGrams());
            if (byWeight.isPresent()) {
                log.info("[{}] SKU promenjen za '{}' {}g — stari URL: {}, novi URL: {}",
                        store.getName(), scraped.getName(),
                        Math.round(scraped.getPrimaryWeightGrams()),
                        byWeight.get().getUrl(), scraped.getUrl());
                byWeight.get().setUrl(scraped.getUrl());
                existingOpt = byWeight;
            } else {
                // Fallback: i URL i ime su se promenili istovremeno (re-platforming prodavnice) —
                // traži najbliži fuzzy match po imenu među proizvodima iste prodavnice/gramaze,
                // umesto da se tretira kao potpuno nov proizvod (što bi ostavilo stari kanonski
                // URL da postane 404 kad ga sledeći scrape obriše kao "stale").
                List<Product> candidates = productRepository.findByStoreAndWeight(store, scraped.getPrimaryWeightGrams());
                Product bestMatch = null;
                int bestScore = 0;
                for (Product candidate : candidates) {
                    int score = me.xdrop.fuzzywuzzy.FuzzySearch.tokenSetRatio(
                            scraped.getName().toLowerCase(), candidate.getName().toLowerCase());
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = candidate;
                    }
                }
                // A high tokenSetRatio score alone can't tell apart two distinct product
                // lines that share a store/weight/brand and mostly-generic vocabulary
                // (e.g. "Whey Gold" vs. "Iso Cool" — both reduce to near-empty distinguishing
                // words). Require the scraped name to share a distinguishing word with the
                // candidate, same guard ProductGroupService uses for grouping — otherwise this
                // fallback can silently re-point an unrelated product's row (and its old price)
                // at the scraped item, poisoning price_history with a fake "drop".
                if (bestMatch != null && bestScore >= FUZZY_MATCH_THRESHOLD
                        && ProductLineMatcher.hasWordOverlap(
                                ProductLineMatcher.productLineWords(scraped.getName(), bestMatch.getBrand()),
                                ProductLineMatcher.productLineWords(bestMatch.getName(), bestMatch.getBrand()))) {
                    log.info("[{}] SKU i ime promenjeni za '{}' {}g — fuzzy match na '{}' (score: {}), stari URL: {}, novi URL: {}",
                            store.getName(), scraped.getName(), Math.round(scraped.getPrimaryWeightGrams()),
                            bestMatch.getName(), bestScore, bestMatch.getUrl(), scraped.getUrl());
                    bestMatch.setUrl(scraped.getUrl());
                    bestMatch.setName(scraped.getName());
                    existingOpt = Optional.of(bestMatch);
                }
            }
        }

        if (scraped.getProteinPer100g() == null || scraped.getProteinPer100g() < 15) {
            if (existingOpt.isPresent() && existingOpt.get().getProteinPer100g() != null
                    && existingOpt.get().getProteinPer100g() >= 15) {
                Product fb = existingOpt.get();
                scraped.setProteinPer100g(fb.getProteinPer100g());
                if (scraped.getFatPer100g() == null)         scraped.setFatPer100g(fb.getFatPer100g());
                if (scraped.getSugarPer100g() == null)       scraped.setSugarPer100g(fb.getSugarPer100g());
                if (scraped.getCaloriePer100g() == null)     scraped.setCaloriePer100g(fb.getCaloriePer100g());
                if (scraped.getProteinSource() == null)      scraped.setProteinSource(fb.getProteinSource());
                if (scraped.getPrimaryWeightGrams() == null) scraped.setPrimaryWeightGrams(fb.getPrimaryWeightGrams());
                log.info("[{}] '{}' — protein null from listing, restored from DB ({}g/100g)",
                        store.getName(), scraped.getName(), scraped.getProteinPer100g());
            } else {
                log.warn("[{}] Skipping '{}' - no valid protein data (protein={})",
                        store.getName(), scraped.getName(), scraped.getProteinPer100g());
                return false;
            }
        }
        scraped.setMarket(store.getMarket() != null ? store.getMarket() : "rs");
        scraped.setCurrency(store.getCurrency() != null ? store.getCurrency() : "RSD");

        Double valueScore = calculateValueScore(numericPrice, scraped);
        double weightGrams = extractPackageGrams(scraped);

        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();

            // Capture old numeric price before overwriting — used for drop detection below
            Double oldNumericPrice = existing.getNumericPrice();

            // --- GUARD 1: weight mismatch (variant confusion) ---
            // For stores that encode weight in the URL (?pakovanje=Xg), verify that the
            // weight parsed from the scraped product matches the weight embedded in the URL.
            // A mismatch means the scraper picked up a different variant's price from the
            // listing page — skip the price update to avoid corrupting existing data.
            if (scraped.getUrl() != null && scraped.getUrl().contains("pakovanje=")) {
                double urlWeightGrams = weightFromUrlParam(scraped.getUrl());
                if (urlWeightGrams > 0 && weightGrams > 0
                        && Math.abs(urlWeightGrams - weightGrams) / urlWeightGrams > 0.15) {
                    log.warn("[{}] Weight mismatch for '{}': URL says {}g but scraped {}g — skipping price update",
                            store.getName(), existing.getName(),
                            Math.round(urlWeightGrams), Math.round(weightGrams));
                    return true;
                }
            }

            // --- GUARD 2: suspicious price jump ---
            // A price change >65% in a single scrape cycle is almost always a variant
            // confusion (listing showed cheapest SKU, DB has heavier SKU). Threshold is
            // set at 65% rather than 40% to allow legitimate large price swings caused
            // by EUR/RSD exchange rate moves while still catching variant mismatches
            // (which typically produce 100–300% differences).
            if (oldNumericPrice != null && oldNumericPrice > 0) {
                double changePct = Math.abs(numericPrice - oldNumericPrice) / oldNumericPrice;
                if (changePct > 0.65) {
                    log.warn("[{}] Suspicious price change for '{}': {} → {} {} ({}%) — keeping old price",
                            store.getName(), existing.getName(),
                            oldNumericPrice, numericPrice, store.getCurrency(),
                            Math.round(changePct * 100));
                    return true;
                }
            }

            String oldPrice = existing.getPrice();
            if (oldNumericPrice != null && numericPrice != null
                    && Math.abs(oldNumericPrice - numericPrice) > 0.01) {
                log.info("[{}] Price change for '{}': {} -> {} {}",
                        store.getName(), existing.getName(),
                        oldNumericPrice, numericPrice, store.getCurrency());
                PriceHistory history = new PriceHistory();
                history.setProduct(existing);
                history.setPrice(oldPrice);
                history.setNumericPrice(oldNumericPrice);
                history.setTimestamp(LocalDateTime.now());
                priceHistoryRepository.save(history);
                existing.setLastPriceChangeAt(history.getTimestamp());
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
            if (weightGrams > 0) {
                Double oldWeight = existing.getPrimaryWeightGrams();
                // Only update weight when change exceeds 2% — prevents source-of-truth
                // discrepancies (e.g. vendor catalog says 1600g, manufacturer label says 1590g)
                // from reverting manual corrections while still catching real packaging changes.
                if (oldWeight == null || Math.abs(weightGrams - oldWeight) / oldWeight > 0.02) {
                    existing.setPrimaryWeightGrams(weightGrams);
                }
            }

            // GROUP 3 — ažuriraj protein ako je null ili ako se promenio za >3g/100g
            // (hvata reformulacije i ispravlja pogrešne stare vrijednosti)
            if (scraped.getProteinPer100g() != null && scraped.getProteinPer100g() <= 95
                    && scraped.getProteinPer100g() >= 15) {
                Double existingProtein = existing.getProteinPer100g();
                if (existingProtein == null || existingProtein < 15
                        || Math.abs(scraped.getProteinPer100g() - existingProtein) > 3.0) {
                    existing.setProteinPer100g(scraped.getProteinPer100g());
                }
            }
            if (existing.getFatPer100g() == null && scraped.getFatPer100g() != null)
                existing.setFatPer100g(scraped.getFatPer100g());
            if (existing.getSugarPer100g() == null && scraped.getSugarPer100g() != null)
                existing.setSugarPer100g(scraped.getSugarPer100g());
            boolean kcalSuspect = existing.getCaloriePer100g() != null && existing.getCaloriePer100g() < 200;
            if ((existing.getCaloriePer100g() == null || kcalSuspect) && scraped.getCaloriePer100g() != null
                    && scraped.getCaloriePer100g() >= 200)
                existing.setCaloriePer100g(scraped.getCaloriePer100g());
            if (existing.getProteinSource() == null && scraped.getProteinSource() != null)
                existing.setProteinSource(scraped.getProteinSource());

            existing.setProteinPerRsd(computeProteinPerRsd(numericPrice, existing));
            existing.setProteinPerCurrency(computeProteinPerRsd(numericPrice, existing));
            existing.setMarket(store.getMarket() != null ? store.getMarket() : "rs");
            existing.setCurrency(store.getCurrency() != null ? store.getCurrency() : "RSD");
            Double updatedScore = calculateValueScore(numericPrice, existing);
            if (updatedScore != null) existing.setValueScore(updatedScore);
            double slugWeight = weightGrams > 0 ? weightGrams
                    : (existing.getPrimaryWeightGrams() != null ? existing.getPrimaryWeightGrams() : 0);
            if (existing.getCanonicalSlug() == null || existing.getCanonicalSlug().isBlank()) {
                existing.setCanonicalSlug(slugifyWithWeight(existing.getName(), slugWeight > 0 ? slugWeight : null, store.getMarket()));
            }
            productRepository.save(existing);
            productGroupService.tryAutoAssign(existing);

            publishPriceDropEventIfSignificant(existing, oldNumericPrice, numericPrice);

            return true;

        } else {
            scraped.setStore(store);
            scraped.setNumericPrice(numericPrice);
            scraped.setValueScore(valueScore);
            if (weightGrams > 0) scraped.setPrimaryWeightGrams(weightGrams);
            scraped.setProteinPerRsd(computeProteinPerRsd(numericPrice, scraped));
            scraped.setProteinPerCurrency(computeProteinPerRsd(numericPrice, scraped));
            scraped.setCanonicalSlug(slugifyWithWeight(scraped.getName(), weightGrams > 0 ? weightGrams : null, store.getMarket()));
            productRepository.save(scraped);
            productGroupService.tryAutoAssign(scraped);
            log.info("[{}] New product saved: '{}'", store.getName(), scraped.getName());
            return true;
        }
    }

    // -------------------- Score calculation --------------------

    public Double calculateValueScore(Double numericPrice, Product p) {
        double brandScore = 4.5;
        if (p.getBrand() != null && !p.getBrand().isBlank()) {
            brandScore = brandReputationRepository
                    .findFirstByBrandNameIgnoreCase(p.getBrand())
                    .map(BrandReputation::getScore)
                    .orElse(4.5);
        }
        return calculateValueScore(numericPrice, p, brandScore);
    }

    public Double calculateValueScore(Double numericPrice, Product p, double brandScore) {
        if (numericPrice == null || numericPrice <= 0) return null;
        if (p.getProteinPer100g() == null) return null;
        double packageGrams = extractPackageGrams(p);
        if (packageGrams <= 0) return null;

        // Detect beef/collagen hydrolysate — nutritionally inferior to whey (no tryptophan, low BCAAs).
        // These products report high protein % by nitrogen assay but have poor DIAAS/PDCAAS scores.
        boolean isBeefCollagen = false;
        if (p.getName() != null) {
            String nameLower = p.getName().toLowerCase();
            isBeefCollagen = nameLower.contains("beef") || nameLower.contains("goveđ") ||
                    nameLower.contains("govedi") || nameLower.contains("hovezi") ||
                    nameLower.contains("collagen") || nameLower.contains("hydrobeef") ||
                    nameLower.contains("hydro beef");
        }

        // 1. VALUE FOR MONEY (0-10) - weight 0.35
        double proteinTotalGrams = (p.getProteinPer100g() / 100.0) * packageGrams;
        if (proteinTotalGrams <= 0) return null;
        double pricePerGramProtein = numericPrice / proteinTotalGrams;
        double maxPricePerGram = "EUR".equals(p.getCurrency()) ? 0.50 : 50.0;
        if (pricePerGramProtein > maxPricePerGram) return null;
        double benchmark = getCategoryBenchmark(p.getProteinSource(), p.getCurrency());
        // Trusted brands justify a price premium — shift the benchmark up so they aren't penalized
        // for costing more than no-name locals (9.5 brand = 25% tolerance, 7.0+ = 12%)
        if (brandScore >= 8.0)      benchmark *= 1.25;
        else if (brandScore >= 7.0) benchmark *= 1.12;
        double ratio = pricePerGramProtein / benchmark;

        double valueMoney = 10.0 / (1.0 + Math.exp(3.5 * (ratio - 1.2)));
        valueMoney = Math.max(0, Math.min(10, valueMoney));

        // 2. PROTEIN PURITY (0-10) - weight 0.20
        double proteinPct = p.getProteinPer100g();
        double proteinPurity = 10 * Math.pow(Math.max(0, (proteinPct - 60) / 40.0), 0.7);
        // Beef/collagen protein has high nitrogen content but poor essential AA profile —
        // the measured protein % overstates the effective quality. Apply a 50% purity penalty.
        if (isBeefCollagen) proteinPurity *= 0.50;
        proteinPurity = Math.max(0, Math.min(10, proteinPurity));

        // 3. DIGESTIBILITY (0-10) - weight 0.15
        double digestibility = 7.0;
        if (isBeefCollagen) {
            // Collagen is missing tryptophan — DIAAS ≈ 0 for muscle protein synthesis purposes
            digestibility = 4.5;
        } else if (p.getProteinSource() != null) {
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
        // Sugar: use measured value when available; otherwise impute from category median.
        double ingredients = 10.0;
        boolean sugarImputed = false;
        double effectiveSugar;
        if (p.getSugarPer100g() != null) {
            effectiveSugar = p.getSugarPer100g();
        } else {
            String src = p.getProteinSource() != null ? p.getProteinSource().toLowerCase() : "";
            effectiveSugar = SUGAR_MEDIAN_BY_SOURCE.getOrDefault(src, 4.0);
            sugarImputed = true;
        }
        if (effectiveSugar > 10)     ingredients -= 3.0;
        else if (effectiveSugar > 5) ingredients -= 1.5;

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

        // Penal: skupo + nepoznat brend
        if (brandScore < 6.0 && ratio > 1.2) {
            valueMoney *= 0.85;
        }

        // 6. CONFIDENCE PENALTY
        // Imputed sugar counts as half-missing (we estimated, not measured).
        double missingWeight = 0;
        if (sugarImputed)                                               missingWeight += 0.5;
        if (p.getFatPer100g() == null)                                  missingWeight += 1;
        if (p.getDescription() == null || p.getDescription().isBlank()) missingWeight += 1;
        if (p.getProteinSource() == null)                               missingWeight += 1;
        double confidencePenalty = Math.max(0.84, 1.0 - (missingWeight * 0.04));

        // FINAL SCORE
        // Brand weight raised to 15% (from 10%) to prevent unknown cheap brands from
        // outranking established, tested brands purely on price.
        double total =
                (0.35 * valueMoney)    +
                        (0.20 * proteinPurity) +
                        (0.15 * digestibility) +
                        (0.15 * ingredients)   +
                        (0.15 * brandScore);

        total *= confidencePenalty;

        // Beef/collagen proteins are nutritionally incomplete — apply a final 0.72x multiplier
        // so they score below quality whey products even when cheaply priced.
        if (isBeefCollagen) total *= 0.72;

        return Math.round(total * 10.0) / 10.0;
    }

    public Double computeProteinPerRsd(Double numericPrice, Product p) {
        if (numericPrice == null || numericPrice <= 0) return null;
        if (p.getProteinPer100g() == null || p.getPrimaryWeightGrams() == null
                || p.getPrimaryWeightGrams() <= 0) return null;
        return (p.getProteinPer100g() / 100.0 * p.getPrimaryWeightGrams()) / numericPrice;
    }

    private double getCategoryBenchmark(String proteinSource, String currency) {
        if ("EUR".equals(currency)) {
            if (proteinSource == null) return 0.065;
            String src = proteinSource.toLowerCase();
            // Benchmarks calibrated to actual HR market median prices (EUR/g protein)
            // HR medians: hydro=0.070, cfm/iso=0.074, casein=0.063, vegan=0.042, blend=0.053, conc=0.065
            if (src.contains("hydro"))       return 0.075;
            if (src.contains("cfm"))         return 0.075;
            if (src.contains("isolat"))      return 0.075;
            if (src.contains("casein"))      return 0.065;
            if (src.contains("vegan"))       return 0.038;
            if (src.contains("blend"))       return 0.053;
            if (src.contains("concentrat"))  return 0.065;
            if (src.contains("egg"))         return 0.065;
            return 0.065;
        }
        if (proteinSource == null) return 5.5;
        String src = proteinSource.toLowerCase();
        // Benchmarks calibrated to actual RS market median prices (RSD/g protein)
        // RS medians: hydro=4.11, iso=6.84, casein=5.37, vegan=5.38, blend=5.86, conc=5.39, egg=9.61
        if (src.contains("hydro"))       return 5.0;
        if (src.contains("cfm"))         return 7.5;
        if (src.contains("isolat"))      return 7.5;
        if (src.contains("casein"))      return 5.5;
        if (src.contains("vegan"))       return 5.8;
        if (src.contains("blend"))       return 6.0;
        if (src.contains("concentrat"))  return 5.5;
        if (src.contains("egg"))         return 9.5;
        return 5.5;
    }

    /**
     * Parses weight from a URL query parameter of the form {@code ?pakovanje=2015g} or
     * {@code ?pakovanje=2.27kg}. Returns 0 if the parameter is absent or unparseable.
     * Used by GUARD 1 to detect variant-confusion price errors.
     */
    private double weightFromUrlParam(String url) {
        try {
            int idx = url.indexOf("pakovanje=");
            if (idx < 0) return 0;
            String raw = url.substring(idx + "pakovanje=".length());
            int end = raw.indexOf('&');
            if (end > 0) raw = raw.substring(0, end);
            raw = java.net.URLDecoder.decode(raw, java.nio.charset.StandardCharsets.UTF_8)
                    .toLowerCase().replaceAll("\\s+", "");
            if (raw.endsWith("kg")) {
                return Double.parseDouble(raw.replace("kg", "").replace(",", ".")) * 1000;
            } else if (raw.endsWith("g")) {
                return Double.parseDouble(raw.replace("g", "").replace(",", "."));
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private double extractPackageGrams(Product p) {
        if (p.getPrimaryWeightGrams() != null && p.getPrimaryWeightGrams() > 0) {
            return p.getPrimaryWeightGrams();
        }
        boolean isEmpty;
        try {
            isEmpty = p.getPackage_weight() == null || p.getPackage_weight().isEmpty();
        } catch (org.hibernate.LazyInitializationException e) {
            return 0;
        }
        if (isEmpty) return 0;

        for (String raw : p.getPackage_weight()) {
            String weight = raw.toLowerCase().replaceAll("\\s+", "");
            try {
                if (weight.contains("kg")) {
                    double val = Double.parseDouble(weight.replace("kg", "").replace(",", ".")) * 1000;
                    if (val > 0) return val;
                } else if (weight.contains("g")) {
                    double val = Double.parseDouble(weight.replace("g", "").replace(",", "."));
                    if (val > 0) return val;
                }
            } catch (Exception ignored) {}
        }

        log.warn("Cannot parse any package weight from: '{}'", p.getPackage_weight());
        return 0;
    }

    // ── URL slug generation ───────────────────────────────────────────────────────

    static String slugify(String text) {
        if (text == null) return "";
        return text
                .replace("Š", "s").replace("š", "s")
                .replace("Č", "c").replace("č", "c")
                .replace("Ć", "c").replace("ć", "c")
                .replace("Ž", "z").replace("ž", "z")
                .replace("Đ", "d").replace("đ", "d")
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^-|-$", "");
    }

    static String slugifyWithWeight(String name, Double weightGrams) {
        return slugifyWithWeight(name, weightGrams, null);
    }

    static String slugifyWithWeight(String name, Double weightGrams, String market) {
        String base = slugify(name);
        String withWeight;
        if (weightGrams == null || weightGrams <= 0) {
            withWeight = base;
        } else {
            long grams = Math.round(weightGrams);
            withWeight = (grams % 1000 == 0)
                    ? base + "-" + (grams / 1000) + "kg"
                    : base + "-" + grams + "g";
        }
        // RS is the default market — no suffix needed for backward compatibility.
        // Every other market gets a "-{market}" suffix to prevent cross-market slug collisions.
        if (market == null || market.isBlank() || "rs".equalsIgnoreCase(market)) return withWeight;
        return withWeight + "-" + market.toLowerCase();
    }

    // ── Price drop detection ──────────────────────────────────────────────────────

    private static final double ALERT_MIN_PCT_DROP = 5.0;
    private static final double ALERT_MIN_RSD_DROP = 300.0;

    /**
     * Publishes a PriceDropEvent when the price drop is significant enough to warrant alerts.
     * Thresholds: ≥5% OR ≥300 RSD absolute drop.
     *
     * The event fires AFTER_COMMIT (via @TransactionalEventListener in the listener),
     * so listeners always see the already-persisted new price.
     */
    private void publishPriceDropEventIfSignificant(Product product, Double oldPrice, Double newPrice) {
        if (oldPrice == null || newPrice == null || newPrice >= oldPrice) return;

        double pctDrop = (oldPrice - newPrice) / oldPrice * 100.0;
        double absDrop = oldPrice - newPrice;

        if (pctDrop < ALERT_MIN_PCT_DROP && absDrop < ALERT_MIN_RSD_DROP) return;

        log.info("[PriceDrop] Significant drop for '{}' (id={}): {} -> {} RSD ({}%)",
                product.getName(), product.getId(),
                Math.round(oldPrice), Math.round(newPrice), String.format("%.1f", pctDrop));

        eventPublisher.publishEvent(new PriceDropEvent(
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                oldPrice,
                newPrice,
                pctDrop
        ));
    }
}