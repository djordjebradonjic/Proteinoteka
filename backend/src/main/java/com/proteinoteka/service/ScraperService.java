package com.proteinoteka.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.Proxy;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.dto.ValueScoreBreakdown;
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
import com.proteinoteka.config.ScrapingTypesProperties;
import com.proteinoteka.service.producttype.ProductTypeProfile;
import com.proteinoteka.service.producttype.ProductTypeRegistry;
import com.proteinoteka.util.PriceIntegrity;
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

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
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
    private final ProductTypeRegistry productTypes;
    private final ScrapingTypesProperties scrapingTypes;
    private final WooStoreApiSource wooStoreApiSource;

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

    // Diagnostic capture for BLOCKED runs (0 products found) — set during scrapeStore()
    // so ScrapingSchedulerService can persist *why* into ScrapeLog.errorMessage without
    // needing live application log access. Scrapes never run concurrently within one JVM
    // (heavy Playwright scrapers are always sequential — see ScrapingSchedulerService's
    // non-overlap invariant), so a plain field is safe here.
    private volatile String lastBlockDiagnostic;

    public String getLastBlockDiagnostic() {
        return lastBlockDiagnostic;
    }

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
        return scrapeStoreOutcome(scraper, testMode, null).products();
    }

    public List<Product> scrapeStore(StoreScraper scraper) {
        return scrapeStore(scraper, false);
    }

    /**
     * What one store run produced across all of its listing targets.
     *
     * @param products    every item the listings returned (saved or not), all product types
     * @param foundByType items returned per product type
     * @param savedByType items actually stored per product type
     * @param primaryType the first target's type; it alone drives the ScrapeLog status, so a failed
     *                    creatine listing can never make a healthy protein run look PARTIAL (and trigger
     *                    a retry that would double the proxy traffic)
     * @param proxyBytes  estimated IPRoyal traffic of the run, null when the store doesn't use the proxy
     * @param removed     stale products deleted by this run, all types
     */
    public record ScrapeOutcome(List<Product> products, Map<String, Integer> foundByType,
                                Map<String, Integer> savedByType, String primaryType, Long proxyBytes,
                                int removed) {

        /** Items found by the primary target: the count the run's status is judged on. */
        public int primaryFound() {
            return foundByType.getOrDefault(primaryType, 0);
        }

        /** Stored items per type as "protein=86,creatine=14". */
        public String typeCounts() {
            return savedByType.entrySet().stream()
                    .map(e -> e.getKey() + "=" + e.getValue())
                    .collect(Collectors.joining(","));
        }
    }

    // State of one listing target during a store run. Each target tracks its own URLs, so a creatine
    // listing can never mark protein products as missing (or the reverse).
    private static final class TargetRun {
        final ListingTarget target;
        final ProductTypeProfile profile;
        final Set<String> existingUrls = new HashSet<>();   // stored URLs of this store+type (stale detection)
        final Set<String> completeUrls = new HashSet<>();   // stored URLs whose detail page adds nothing
        final Set<String> foundUrls = new HashSet<>();      // URLs saved by this run
        final List<Product> products = new ArrayList<>();
        int saved;
        boolean blocked;
        boolean completed;

        TargetRun(ListingTarget target, ProductTypeProfile profile) {
            this.target = target;
            this.profile = profile;
        }
    }

    /**
     * Scrapes every enabled listing target of {@code scraper} inside ONE browser context and proxy
     * session — a second product family costs one more listing, not a second run, and reuses the anti-bot
     * clearance the first one earned. The primary (first) target runs first; if it is blocked the others
     * are skipped, so no proxy traffic is spent on a session that is known to be blocked.
     *
     * @param onlyTypes when non-null, exactly these product types are scraped and the enabled-types
     *                  config is bypassed (an explicit admin request, e.g. to test or backfill creatine
     *                  on one store without re-scraping its protein)
     */
    public ScrapeOutcome scrapeStoreOutcome(StoreScraper scraper, boolean testMode, Set<String> onlyTypes) {
        Store store = storeRepository.findByName(scraper.getStoreRowName())
                .orElseThrow(() -> new RuntimeException("Store not found: " + scraper.getStoreRowName()));

        lastBlockDiagnostic = null;
        List<TargetRun> runs = buildRuns(scraper, store, testMode, onlyTypes);
        if (runs.isEmpty()) {
            log.warn("[{}] No listing target selected (onlyTypes={}) — nothing to scrape", scraper.getStoreName(), onlyTypes);
            return new ScrapeOutcome(List.of(), Map.of(), Map.of(), scraper.getProductType(), null, 0);
        }

        // Rows already matched by an item of this run — the URL-changed fallbacks must not
        // re-point them at a different item (see saveOrUpdateProduct).
        Set<Long> claimedProductIds = new HashSet<>();
        boolean useProxyForThisStore = proxyEnabled && scraper.requiresProxy();
        ProxyUsageMeter meter = useProxyForThisStore ? new ProxyUsageMeter() : null;

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
                if (useProxyForThisStore) {
                    log.info("[{}] Proxy enabled: {}:{}", scraper.getStoreName(), proxyHost, proxyPort);
                }
                // iProyal's residential gateway hands out a NEW IP per connection by default
                // (no session param) — great for one-off requests, but bad for a Cloudflare-
                // protected multi-page run: the exit IP drifting mid-session while cookies
                // (cf_clearance) stay put is itself a bot signal. Pin one IP for this whole
                // scrapeStore() run via a sticky session, and let it rotate to a fresh
                // residential IP on the NEXT run (next call to scrapeStore()) instead.
                String stickyProxyPassword = useProxyForThisStore
                        ? proxyPassword + "_session-" + randomSessionId() + "_lifetime-1h"
                        : proxyPassword;

                Browser.NewContextOptions contextOptions = new Browser.NewContextOptions()
                        .setUserAgent(randomUA)
                        .setViewportSize(1920, 1080)
                        .setLocale(scraper.getLocale())
                        .setTimezoneId(scraper.getTimezoneId())
                        .setDeviceScaleFactor(1)
                        .setExtraHTTPHeaders(Map.of(
                                "Accept-Language", scraper.getAcceptLanguage(),
                                "Accept-Encoding", "gzip, deflate, br",
                                "DNT", "1",
                                "Upgrade-Insecure-Requests", "1"
                        ));

                if (useProxyForThisStore && !proxyHost.isBlank()) {
                    contextOptions.setProxy(new Proxy("http://" + proxyHost + ":" + proxyPort)
                            .setUsername(proxyUsername)
                            .setPassword(stickyProxyPassword));
                }

                BrowserContext context = browser.newContext(contextOptions);
                if (meter != null) context.onRequestFinished(meter::addRequest);

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

                context.addInitScript(buildStealthScript(
                        extractChromeVersion(randomUA),
                        buildLanguagesArray(scraper.getLocale())));

                try {
                    Page page = context.newPage();
                    try {
                        for (int i = 0; i < runs.size(); i++) {
                            TargetRun run = runs.get(i);
                            if (i > 0 && runs.get(0).blocked) {
                                log.warn("[{}] Skipping the {} listing — the primary {} listing was blocked",
                                        scraper.getStoreName(), run.profile.code(), runs.get(0).profile.code());
                                continue;
                            }
                            long bytesBefore = meter == null ? 0 : meter.total();
                            try {
                                scrapeTarget(scraper, run, page, store, testMode, claimedProductIds,
                                        useProxyForThisStore, meter);
                                run.completed = true;
                            } catch (Exception e) {
                                // One listing failing (site hiccup, parse bug, API change) must not take the
                                // other families of the same store down with it.
                                log.error("[{}] {} listing failed: {}", scraper.getStoreName(),
                                        run.profile.code(), e.getMessage(), e);
                                run.blocked = true;
                                if (lastBlockDiagnostic == null) {
                                    lastBlockDiagnostic = run.profile.code() + "-listing-failed msg=" + e.getMessage();
                                }
                            }
                            if (meter != null) {
                                log.info("[{}] {} listing used ~{} KB of proxy traffic", scraper.getStoreName(),
                                        run.profile.code(), (meter.total() - bytesBefore) / 1024);
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
            for (TargetRun run : runs) {
                if (!run.completed) run.blocked = true;
            }
        }

        int removed = 0;
        if (staleEnabled && !testMode) {
            for (TargetRun run : runs) {
                if (run.completed && !run.blocked && !run.existingUrls.isEmpty()) {
                    removed += removeStaleProducts(scraper.getStoreName(), run.profile.code(),
                            run.existingUrls, run.foundUrls);
                }
            }
        }

        List<Product> all = new ArrayList<>();
        Map<String, Integer> foundByType = new LinkedHashMap<>();
        Map<String, Integer> savedByType = new LinkedHashMap<>();
        for (TargetRun run : runs) {
            all.addAll(run.products);
            foundByType.merge(run.profile.code(), run.products.size(), Integer::sum);
            savedByType.merge(run.profile.code(), run.saved, Integer::sum);
        }
        ScrapeOutcome outcome = new ScrapeOutcome(all, foundByType, savedByType, runs.get(0).profile.code(),
                meter == null ? null : meter.total(), removed);
        log.info("[{}] Scraping complete. Total products: {} (saved {}){}", scraper.getStoreName(), all.size(),
                outcome.typeCounts(), meter == null ? "" : ", ~" + meter.total() / 1024 + " KB proxy traffic");
        return outcome;
    }

    private boolean isSelected(StoreScraper scraper, ListingTarget target, Set<String> onlyTypes) {
        return onlyTypes != null
                ? onlyTypes.contains(target.productType())
                : scrapingTypes.isEnabled(target.productType(), scraper.getStoreName());
    }

    /**
     * The product types a run of {@code scraper} would scrape right now. Empty means there is nothing to
     * do (e.g. a scraper whose only listing is a family that is switched off) and the caller should skip
     * the run instead of logging it as a blocked scrape.
     */
    public List<String> selectedTypes(StoreScraper scraper, Set<String> onlyTypes) {
        return scraper.listingTargets().stream()
                .filter(t -> isSelected(scraper, t, onlyTypes))
                .map(ListingTarget::productType)
                .toList();
    }

    /** The targets to run, each with its stale-detection and skip-detail state loaded. */
    private List<TargetRun> buildRuns(StoreScraper scraper, Store store, boolean testMode, Set<String> onlyTypes) {
        List<Product> storedRows = null;
        List<TargetRun> runs = new ArrayList<>();
        for (ListingTarget target : scraper.listingTargets()) {
            if (!isSelected(scraper, target, onlyTypes)) continue;

            TargetRun run = new TargetRun(target, productTypes.forCode(target.productType()));
            if (staleEnabled && !testMode) {
                run.existingUrls.addAll(productRepository.findUrlsByStoreNameAndProductType(
                        store.getName(), target.productType()));
                log.info("[{}] Stale detection ({}): {} existing products tracked",
                        scraper.getStoreName(), target.productType(), run.existingUrls.size());
            }
            if (storedRows == null) storedRows = productRepository.findAllByStoreName(store.getName());
            run.completeUrls.addAll(completeDetailUrls(scraper, storedRows, run.profile));
            log.info("[{}] {} {} products already have complete data — detail page will be skipped",
                    scraper.getStoreName(), run.completeUrls.size(), target.productType());
            runs.add(run);
        }
        return runs;
    }

    // URLs whose stored data is already complete for their type — the detail page visit is skipped.
    // What "complete" means is the type profile's call. Scrapers that declare
    // skipDetailIfDescriptionExists()=true (nutrition in images) skip detail fetches for any product that
    // already has brand + description in DB.
    private Set<String> completeDetailUrls(StoreScraper scraper, List<Product> storedRows, ProductTypeProfile profile) {
        boolean nutritionInImages = scraper.skipDetailIfDescriptionExists();
        return storedRows.stream()
                .filter(p -> profile.code().equals(p.getProductType()))
                .filter(p -> {
                    boolean hasDescription = p.getDescription() != null && !p.getDescription().isBlank();
                    if (!hasDescription) return false;
                    if (!profile.isDetailComplete(p, nutritionInImages)) return false;
                    return !nutritionInImages || (p.getBrand() != null && !p.getBrand().isBlank());
                })
                .map(Product::getUrl)
                .collect(Collectors.toSet());
    }

    private void scrapeTarget(StoreScraper scraper, TargetRun run, Page page, Store store, boolean testMode,
                              Set<Long> claimedProductIds, boolean useProxy, ProxyUsageMeter meter) throws Exception {
        switch (run.target.source()) {
            case ListingTarget.HtmlPaged source ->
                    scrapeHtmlTarget(scraper, run, source, page, store, testMode, claimedProductIds, useProxy, meter);
            case ListingTarget.WooStoreApi source ->
                    scrapeWooTarget(run, source, store, claimedProductIds, useProxy, meter);
        }
    }

    private void scrapeWooTarget(TargetRun run, ListingTarget.WooStoreApi source, Store store,
                                 Set<Long> claimedProductIds, boolean useProxy, ProxyUsageMeter meter) throws IOException {
        List<Product> items;
        try {
            items = wooStoreApiSource.fetch(source, store, useProxy, meter);
        } catch (IOException e) {
            if (lastBlockDiagnostic == null) {
                lastBlockDiagnostic = "woo-api-failed slug=" + source.categorySlug()
                        + " msg=" + e.getMessage() + " proxy=" + useProxy;
            }
            throw e;
        }
        items = PriceIntegrity.keepLowestPricePerUrl(items, item -> priceParser.parse(item.getPrice()));
        persistScraped(run, items, store, claimedProductIds);
    }

    private void scrapeHtmlTarget(StoreScraper scraper, TargetRun run, ListingTarget.HtmlPaged source, Page page,
                                  Store store, boolean testMode, Set<Long> claimedProductIds,
                                  boolean useProxyForThisStore, ProxyUsageMeter meter) throws InterruptedException {
        int currentPage = 0;
        int consecutivePageFailures = 0;

        while (true) {
            long delay = testMode ? 500 : humanDelay();
            log.info("[{}] Waiting {}ms before next page...", scraper.getStoreName(), delay);
            Thread.sleep(delay);

            String url = source.pageUrl().apply(currentPage);
            log.info("[{}] Scraping {} page {}: {}", scraper.getStoreName(), run.profile.code(), currentPage, url);

            boolean pageLoadFailed = false;
            if (!scraper.usePlaywrightForListing()) {
                // Server-rendered stores (PrestaShop, Drupal, Next.js SSR) — JSoup is enough for listing.
                // Avoids loading images/JS/tracking through proxy on listing pages.
                try {
                    String html = fetchHtml(url, scraper.requiresProxy(), meter);
                    page.setContent(html);
                    log.info("[{}] JSoup listing fetch succeeded for {}", scraper.getStoreName(), url);
                } catch (Exception jsoupEx) {
                    log.error("[{}] JSoup listing fetch failed for page {}: {}",
                            scraper.getStoreName(), currentPage, jsoupEx.getMessage());
                    pageLoadFailed = true;
                    if (currentPage == 0 && lastBlockDiagnostic == null) {
                        lastBlockDiagnostic = "jsoup-listing-failed msg=" + jsoupEx.getMessage()
                                + " proxy=" + scraper.requiresProxy();
                    }
                }
            } else if (!navigateWithRetry(page, url, 3)) {
                log.warn("[{}] Playwright navigation failed — trying JSoup direct fetch for {}",
                        scraper.getStoreName(), url);
                try {
                    String html = fetchHtml(url, scraper.requiresProxy(), meter);
                    page.setContent(html);
                    log.info("[{}] JSoup direct fetch succeeded for {}", scraper.getStoreName(), url);
                } catch (Exception jsoupEx) {
                    log.error("[{}] JSoup fallback also failed for page {}: {}",
                            scraper.getStoreName(), currentPage, jsoupEx.getMessage());
                    pageLoadFailed = true;
                    if (currentPage == 0) {
                        lastBlockDiagnostic = "playwright-and-jsoup-failed msg=" + jsoupEx.getMessage()
                                + " proxy=" + scraper.requiresProxy()
                                + " | " + lastBlockDiagnostic;
                    }
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
                    return;
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
                    run.blocked = true;
                    lastBlockDiagnostic = String.format(
                            "firewall title='%s' url=%s proxy=%s page=%d",
                            safeTitle(page), safeUrl(page), useProxyForThisStore, currentPage);
                    return;
                }
                log.info("[{}] Firewall bypassed via waitForListing fallback.", scraper.getStoreName());
            } else {
                simulateHumanScroll(page);
                scraper.waitForListing(page);
            }

            Document doc = Jsoup.parse(page.content());
            List<Product> pageProducts = scraper.scrape(run.target, run.profile, page, doc, run.completeUrls);

            log.info("[{}] Found {} {} products on page {}",
                    scraper.getStoreName(), pageProducts.size(), run.profile.code(), currentPage);

            // Page loaded, title didn't match any known challenge string, yet the
            // listing parsed zero products — a silent block (e.g. a Turnstile
            // interstitial that leaves <title> unchanged, or a bot-detection page
            // with unfamiliar wording). Capture it the same way so BLOCKED runs are
            // diagnosable from ScrapeLog.errorMessage without live log access.
            if (currentPage == 0 && pageProducts.isEmpty() && lastBlockDiagnostic == null) {
                lastBlockDiagnostic = String.format(
                        "no-products title='%s' url=%s proxy=%s contentLen=%d",
                        safeTitle(page), safeUrl(page), useProxyForThisStore, doc.html().length());
            }

            // The same URL emitted twice with different prices would be written as two
            // price changes in one run (A→B→A history, re-"discovered" as a drop every
            // week). Keep one item per URL — the lowest price, like the variant scrapers.
            pageProducts = PriceIntegrity.keepLowestPricePerUrl(
                    pageProducts, item -> priceParser.parse(item.getPrice()));

            persistScraped(run, pageProducts, store, claimedProductIds);

            if (!scraper.hasNextPage(doc)) {
                log.info("[{}] No more pages found", scraper.getStoreName());
                return;
            }

            currentPage++;

            if (testMode) {
                log.info("[{}] TEST MODE: Stopping after first page", scraper.getStoreName());
                return;
            }

            if (currentPage > 50) {
                log.warn("[{}] Reached max page limit (50), stopping", scraper.getStoreName());
                return;
            }
        }
    }

    private void persistScraped(TargetRun run, List<Product> scraped, Store store, Set<Long> claimedProductIds) {
        for (Product p : scraped) {
            p.setStore(store);
            p.setProductType(run.profile.code());
            boolean saved = saveOrUpdateProduct(p, store, claimedProductIds, run.profile, run.target.categoryTrusted());
            run.products.add(p);
            if (saved) {
                run.saved++;
                if (p.getUrl() != null) run.foundUrls.add(p.getUrl());
            }
        }
    }

    private String fetchHtml(String url, boolean useProxy, ProxyUsageMeter meter) throws IOException {
        org.jsoup.Connection.Response response = httpClient.connection(url, useProxy).execute();
        if (useProxy && meter != null) meter.addResponse(response);
        return response.parse().html();
    }

    // -------------------- Stale product cleanup --------------------

    // A product is only deleted after this many *consecutive* scrapes in which its URL was
    // expected but not found — one missed scrape alone (e.g. a transient bot-block or a
    // store's temporary outage that still stays under maxRemovalPercent) no longer deletes
    // a still-listed product.
    private static final int STALE_MISS_THRESHOLD = 3;

    /** @return how many stale products were deleted */
    private int removeStaleProducts(String storeName, String productType, Set<String> existingUrlSet,
                                    Set<String> foundUrls) {
        String label = storeName + "/" + productType;
        if (foundUrls.isEmpty()) {
            log.warn("[{}] Stale removal skipped — scrape found 0 valid products (possible block or scrape error)", label);
            return 0;
        }

        productRepository.resetMissedScrapes(foundUrls);

        Set<String> missingUrls = new HashSet<>(existingUrlSet);
        missingUrls.removeAll(foundUrls);

        if (missingUrls.isEmpty()) {
            log.info("[{}] No stale products detected", label);
            return 0;
        }

        double removalPercent = (double) missingUrls.size() / existingUrlSet.size() * 100;
        if (removalPercent > maxRemovalPercent) {
            log.warn("[{}] Safety check FAILED — skipping stale removal, not counting this as a miss either (likely a site-wide block, not real removals). Found: {}, Missing: {} ({}% would be removed, threshold {}%)",
                    label, foundUrls.size(), missingUrls.size(), (int) removalPercent, maxRemovalPercent);
            return 0;
        }

        productRepository.incrementMissedScrapes(missingUrls);

        List<String> urlsToDelete = productRepository.findUrlsWithMissedScrapesAtLeast(missingUrls, STALE_MISS_THRESHOLD);
        if (urlsToDelete.isEmpty()) {
            log.info("[{}] {} product(s) missing this scrape but under the grace threshold ({} consecutive misses) — not deleted yet",
                    label, missingUrls.size(), STALE_MISS_THRESHOLD);
            return 0;
        }

        log.info("[{}] Removing {} stale products (missed {}+ consecutive scrapes): {}",
                label, urlsToDelete.size(), STALE_MISS_THRESHOLD, urlsToDelete);
        productRepository.deleteByUrlIn(urlsToDelete);

        log.info("[{}] Stale removal complete — {} products removed", label, urlsToDelete.size());
        return urlsToDelete.size();
    }

    // -------------------- ANTI-BAN HELPERS --------------------

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(45000));
                page.waitForTimeout(500 + (int)(Math.random() * 1000));
                return true;
            } catch (Exception e) {
                log.warn("Navigate retry {}/{} for {}: {}", i + 1, maxRetries, url, e.getMessage());
                if (i == maxRetries - 1 && lastBlockDiagnostic == null) {
                    lastBlockDiagnostic = "navigate-failed msg=" + e.getMessage();
                }
                try {
                    Thread.sleep(2000 * (i + 1));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        return false;
    }

    private static String safeTitle(Page page) {
        try { return page.title(); } catch (Exception e) { return "?"; }
    }

    private static String safeUrl(Page page) {
        try { return page.url(); } catch (Exception e) { return "?"; }
    }

    private boolean isBlockedByFirewall(Page page) {
        try {
            String title = page.title();
            // Cloudflare's "Just a moment..." interstitial is localized per the request's
            // Accept-Language header — which we deliberately set to sr-RS for these stores
            // (see contextOptions above), so it renders as "Sačekajte trenutak..." rather
            // than the English string. Confirmed live on both Proteinbox and Polleo Sport
            // via lastBlockDiagnostic: both showed this exact Serbian title, meaning the
            // English-only check below never recognized the challenge page, so the
            // waitForListing-retry path (which gives the JS challenge time to clear) never
            // ran and the scrape fell straight through to a silent 0-product result.
            return title.contains("Cloudflare")
                    || title.contains("Just a moment")
                    || title.contains("Attention Required")
                    || title.contains("Access denied")
                    || title.contains("Sačekajte")   // sr
                    || title.contains("Sacekajte")   // sr ascii fallback
                    || title.contains("Pričekajte")  // hr
                    || title.contains("Pricekajte"); // hr ascii fallback
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

    private static String extractChromeVersion(String userAgent) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("Chrome/(\\d+)").matcher(userAgent);
        return m.find() ? m.group(1) : "124";
    }

    // Converts a BCP-47 locale like "hr-HR" into a JS array literal like ['hr-HR','hr','en-US','en']
    private static String buildLanguagesArray(String locale) {
        String lang = locale.contains("-") ? locale.substring(0, locale.indexOf('-')) : locale;
        if (locale.equals(lang)) {
            return "['" + locale + "', 'en-US', 'en']";
        }
        return "['" + locale + "', '" + lang + "', 'en-US', 'en']";
    }

    private static String buildStealthScript(String chromeVersion, String languages) {
        return
            "// 1. Remove webdriver flag — primary Cloudflare check\n" +
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });\n" +
            "\n" +
            "// 2. Full chrome object — headless omits these by default\n" +
            "window.chrome = {\n" +
            "  app: {\n" +
            "    isInstalled: false,\n" +
            "    InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },\n" +
            "    RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }\n" +
            "  },\n" +
            "  runtime: {\n" +
            "    OnInstalledReason: {}, OnRestartRequiredReason: {},\n" +
            "    PlatformArch: {}, PlatformNaclArch: {}, PlatformOs: {}, RequestUpdateCheckStatus: {}\n" +
            "  },\n" +
            "  loadTimes: function() {},\n" +
            "  csi: function() {}\n" +
            "};\n" +
            "\n" +
            "// 3. Permissions — headless returns 'denied' for notifications; real browser returns 'default'\n" +
            "const _origPermQuery = window.navigator.permissions.query.bind(navigator.permissions);\n" +
            "window.navigator.permissions.query = (params) =>\n" +
            "  params.name === 'notifications'\n" +
            "    ? Promise.resolve({ state: Notification.permission })\n" +
            "    : _origPermQuery(params);\n" +
            "\n" +
            "// 4. Realistic plugins list (headless has none)\n" +
            "Object.defineProperty(navigator, 'plugins', {\n" +
            "  get: () => {\n" +
            "    const p = [\n" +
            "      { name: 'Chrome PDF Plugin',  filename: 'internal-pdf-viewer',              description: 'Portable Document Format' },\n" +
            "      { name: 'Chrome PDF Viewer',  filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },\n" +
            "      { name: 'Native Client',      filename: 'internal-nacl-plugin',             description: '' }\n" +
            "    ];\n" +
            "    p.__proto__ = PluginArray.prototype;\n" +
            "    return p;\n" +
            "  }\n" +
            "});\n" +
            "\n" +
            "// 5. Language + hardware fingerprint — locale-matched to each scraper's market\n" +
            "Object.defineProperty(navigator, 'languages',           { get: () => " + languages + " });\n" +
            "Object.defineProperty(navigator, 'vendor',              { get: () => 'Google Inc.' });\n" +
            "Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });\n" +
            "Object.defineProperty(navigator, 'deviceMemory',        { get: () => 8 });\n" +
            "\n" +
            "// 6. Network info — headless omits navigator.connection\n" +
            "Object.defineProperty(navigator, 'connection', {\n" +
            "  get: () => ({ rtt: 50, downlink: 10, effectiveType: '4g', saveData: false })\n" +
            "});\n" +
            "\n" +
            "// 7. Window + screen dimensions — headless values differ from a real desktop\n" +
            "window.outerWidth  = window.innerWidth;\n" +
            "window.outerHeight = window.innerHeight + 100;\n" +
            "try {\n" +
            "  Object.defineProperty(screen, 'width',       { get: () => 1920 });\n" +
            "  Object.defineProperty(screen, 'height',      { get: () => 1080 });\n" +
            "  Object.defineProperty(screen, 'availWidth',  { get: () => 1920 });\n" +
            "  Object.defineProperty(screen, 'availHeight', { get: () => 1040 });\n" +
            "  Object.defineProperty(screen, 'colorDepth',  { get: () => 24 });\n" +
            "  Object.defineProperty(screen, 'pixelDepth',  { get: () => 24 });\n" +
            "} catch(e) {}\n" +
            "\n" +
            "// 8. WebGL1 + WebGL2 renderer — headless shows SwiftShader/llvmpipe; spoof Intel\n" +
            "try {\n" +
            "  const _getParam = WebGLRenderingContext.prototype.getParameter;\n" +
            "  WebGLRenderingContext.prototype.getParameter = function(param) {\n" +
            "    if (param === 37445) return 'Intel Inc.';\n" +
            "    if (param === 37446) return 'Intel Iris OpenGL Engine';\n" +
            "    return _getParam.call(this, param);\n" +
            "  };\n" +
            "} catch(e) {}\n" +
            "try {\n" +
            "  const _getParam2 = WebGL2RenderingContext.prototype.getParameter;\n" +
            "  WebGL2RenderingContext.prototype.getParameter = function(param) {\n" +
            "    if (param === 37445) return 'Intel Inc.';\n" +
            "    if (param === 37446) return 'Intel Iris OpenGL Engine';\n" +
            "    return _getParam2.call(this, param);\n" +
            "  };\n" +
            "} catch(e) {}\n" +
            "\n" +
            "// 9. Canvas fingerprint — inject imperceptible per-session noise so the\n" +
            "// toDataURL hash differs from the known headless constant value\n" +
            "try {\n" +
            "  const _toDataURL = HTMLCanvasElement.prototype.toDataURL;\n" +
            "  HTMLCanvasElement.prototype.toDataURL = function(type, ...args) {\n" +
            "    const ctx = this.getContext('2d');\n" +
            "    if (ctx && this.width > 0 && this.height > 0) {\n" +
            "      const imgData = ctx.getImageData(0, 0, 1, 1);\n" +
            "      imgData.data[0] ^= 3;\n" +
            "      ctx.putImageData(imgData, 0, 0);\n" +
            "    }\n" +
            "    return _toDataURL.call(this, type, ...args);\n" +
            "  };\n" +
            "  const _getImageData = CanvasRenderingContext2D.prototype.getImageData;\n" +
            "  CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {\n" +
            "    const data = _getImageData.call(this, sx, sy, sw, sh);\n" +
            "    data.data[0] ^= 3;\n" +
            "    return data;\n" +
            "  };\n" +
            "} catch(e) {}\n" +
            "\n" +
            "// 10. AudioContext fingerprint — add tiny deterministic noise to frequency data\n" +
            "try {\n" +
            "  const _getChannelData = AudioBuffer.prototype.getChannelData;\n" +
            "  AudioBuffer.prototype.getChannelData = function(channel) {\n" +
            "    const arr = _getChannelData.call(this, channel);\n" +
            "    if (arr.length > 0) arr[0] += 1e-7;\n" +
            "    return arr;\n" +
            "  };\n" +
            "} catch(e) {}\n" +
            "\n" +
            "// 11. navigator.userAgentData — Chrome 90+ Client Hints API; headless may omit or\n" +
            "// return a version inconsistent with the spoofed User-Agent string\n" +
            "try {\n" +
            "  Object.defineProperty(navigator, 'userAgentData', {\n" +
            "    get: () => ({\n" +
            "      brands: [\n" +
            "        { brand: 'Not:A-Brand',    version: '8' },\n" +
            "        { brand: 'Chromium',       version: '" + chromeVersion + "' },\n" +
            "        { brand: 'Google Chrome',  version: '" + chromeVersion + "' }\n" +
            "      ],\n" +
            "      mobile: false,\n" +
            "      platform: 'Windows',\n" +
            "      getHighEntropyValues: () => Promise.resolve({})\n" +
            "    })\n" +
            "  });\n" +
            "} catch(e) {}\n";
    }

    // iProyal sticky-session IDs must be an 8-character alphanumeric string.
    private static final String SESSION_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

    private String randomSessionId() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(SESSION_ID_ALPHABET.charAt(ThreadLocalRandom.current().nextInt(SESSION_ID_ALPHABET.length())));
        }
        return sb.toString();
    }

    // -------------------- Save / Update --------------------

    @Transactional
    public boolean saveOrUpdateProduct(Product scraped, Store store) {
        return saveOrUpdateProduct(scraped, store, new HashSet<>());
    }

    /**
     * @param claimedProductIds ids of rows already matched by an item of the current scrape run
     *                          (updated in place). A row claimed by one item is never re-pointed at
     *                          another by the URL-changed fallbacks — that flip-flopped one row
     *                          between two different products and wrote fake price drops.
     */
    @Transactional
    public boolean saveOrUpdateProduct(Product scraped, Store store, Set<Long> claimedProductIds) {
        return saveOrUpdateProduct(scraped, store, claimedProductIds, productTypes.forProduct(scraped), false);
    }

    /**
     * @param profile         rules of the product family being saved (acceptance, ranges, price floor,
     *                        family-specific fields) — see {@link ProductTypeProfile}
     * @param categoryTrusted the item came from a listing dedicated to that family
     */
    @Transactional
    public boolean saveOrUpdateProduct(Product scraped, Store store, Set<Long> claimedProductIds,
                                       ProductTypeProfile profile, boolean categoryTrusted) {

        // 0. Does the item belong to this product family at all?
        Optional<String> rejected = profile.rejectReason(scraped, categoryTrusted);
        if (rejected.isPresent()) {
            log.info("[{}] Skipping '{}' — {}", store.getName(), scraped.getName(), rejected.get());
            return false;
        }

        // 1. Normalizuj brend
        // Some store templates leak page text into the brand field (e.g. "g | Biljni Protein iz...").
        // That is never a brand: drop it so it can't create a junk brand_reputation miss.
        if (scraped.getBrand() != null
                && (scraped.getBrand().length() > 40 || scraped.getBrand().contains("|"))) {
            log.warn("[{}] Discarding implausible brand '{}' for '{}'",
                    store.getName(), scraped.getBrand(), scraped.getName());
            scraped.setBrand(null);
        }
        if (scraped.getBrand() != null) {
            scraped.setBrand(brandNormalizer.normalize(scraped.getBrand()));
        }

        // 2. Validacija vrednosti specifičnih za tip proizvoda (protein: makroi; kreatin: doza/pakovanje)
        profile.sanitize(scraped, store.getName());

        // 3. Validacija cene
        Double numericPrice = priceParser.parse(scraped.getPrice());
        if (numericPrice == null || numericPrice == 0) {
            log.warn("[{}] Skipping '{}' - no valid price", store.getName(), scraped.getName());
            return false;
        }
        double minPrice = profile.minPrice(store.getCurrency());
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
            List<Product> byWeight = productRepository.findAllByNameAndStoreAndWeight(
                    scraped.getName(), store, scraped.getPrimaryWeightGrams(), profile.code());
            if (byWeight.size() > 1) {
                // The store lists several products under this exact title and weight (different brands
                // behind one generic name), so which of them the item is cannot be told — and neither
                // can the fuzzy fallback below. Nothing is re-pointed: the item becomes its own row.
                log.warn("[{}] {} stored rows share '{}' {}g — cannot tell which one is {}, treating it as a new product",
                        store.getName(), byWeight.size(), scraped.getName(),
                        Math.round(scraped.getPrimaryWeightGrams()), scraped.getUrl());
            } else if (!byWeight.isEmpty()) {
                Product match = byWeight.get(0);
                if (isRepointAllowed(match, numericPrice, claimedProductIds)) {
                    log.info("[{}] SKU promenjen za '{}' {}g — stari URL: {}, novi URL: {}",
                            store.getName(), scraped.getName(),
                            Math.round(scraped.getPrimaryWeightGrams()),
                            match.getUrl(), scraped.getUrl());
                    match.setUrl(scraped.getUrl());
                    existingOpt = Optional.of(match);
                } else {
                    // Same name+weight but a different product (claimed by another item this run,
                    // or the price is too far off) — becomes a new row instead of hijacking this one.
                    log.warn("[{}] Refusing to re-point '{}' {}g (row {} at {} {}, scraped {} {}): "
                                    + "claimed this run or price deviates >{}% — treating as a new product",
                            store.getName(), scraped.getName(),
                            Math.round(scraped.getPrimaryWeightGrams()), match.getId(),
                            match.getNumericPrice(), store.getCurrency(), numericPrice, store.getCurrency(),
                            Math.round(PriceIntegrity.MAX_REPOINT_PRICE_DEVIATION * 100));
                }
            } else {
                // Fallback: i URL i ime su se promenili istovremeno (re-platforming prodavnice) —
                // traži najbliži fuzzy match po imenu među proizvodima iste prodavnice/gramaze,
                // umesto da se tretira kao potpuno nov proizvod (što bi ostavilo stari kanonski
                // URL da postane 404 kad ga sledeći scrape obriše kao "stale").
                List<Product> candidates = productRepository.findByStoreAndWeight(
                        store, scraped.getPrimaryWeightGrams(), profile.code());
                Product bestMatch = null;
                int bestScore = 0;
                for (Product candidate : candidates) {
                    // Only rows that can safely change identity are eligible: not already matched
                    // by another item this run, and with a near-identical price. Filtering here
                    // (rather than rejecting the best match afterwards) lets a legitimate
                    // candidate win over a higher-scoring but unsafe one.
                    if (!isRepointAllowed(candidate, numericPrice, claimedProductIds)) continue;
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
                        && ProductLineMatcher.sameProductLine(
                                scraped.getName(), bestMatch.getBrand(),
                                bestMatch.getName(), bestMatch.getBrand())) {
                    log.info("[{}] SKU i ime promenjeni za '{}' {}g — fuzzy match na '{}' (score: {}), stari URL: {}, novi URL: {}",
                            store.getName(), scraped.getName(), Math.round(scraped.getPrimaryWeightGrams()),
                            bestMatch.getName(), bestScore, bestMatch.getUrl(), scraped.getUrl());
                    bestMatch.setUrl(scraped.getUrl());
                    bestMatch.setName(scraped.getName());
                    existingOpt = Optional.of(bestMatch);
                }
            }
        }

        if (!profile.restoreFromStored(scraped, existingOpt, store.getName())) {
            return false;
        }
        scraped.setMarket(store.getMarket() != null ? store.getMarket() : "rs");
        scraped.setCurrency(store.getCurrency() != null ? store.getCurrency() : "RSD");

        Double valueScore = calculateValueScore(numericPrice, scraped);
        double weightGrams = extractPackageGrams(scraped);

        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            if (existing.getId() != null) claimedProductIds.add(existing.getId());

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
                if (PriceIntegrity.isCredibleChange(oldNumericPrice, numericPrice)) {
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
                    if (numericPrice < oldNumericPrice) {
                        existing.setLastPriceDropPct((oldNumericPrice - numericPrice) / oldNumericPrice);
                        existing.setLastPriceIncreasePct(null);
                    } else {
                        existing.setLastPriceDropPct(null);
                        existing.setLastPriceIncreasePct((numericPrice - oldNumericPrice) / oldNumericPrice);
                    }
                } else {
                    // A move this large is a different product/pack on the same row, not a repricing:
                    // take the new price but don't fabricate a "drop" (or keep an older one that no
                    // longer describes this price).
                    log.warn("[{}] Implausible price move for '{}': {} -> {} {} — updating price without recording a price change",
                            store.getName(), existing.getName(),
                            oldNumericPrice, numericPrice, store.getCurrency());
                    existing.setLastPriceDropPct(null);
                    existing.setLastPriceIncreasePct(null);
                }
            }

            // GROUP 1 — uvek ažuriraj
            existing.setPrice(scraped.getPrice());
            existing.setNumericPrice(numericPrice);
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

            // GROUP 3 — polja specifična za tip proizvoda (protein: makroi; kreatin: oblik, doza, pakovanje)
            profile.mergeInto(existing, scraped);

            existing.setProteinPerRsd(computeProteinPerRsd(numericPrice, existing));
            existing.setProteinPerCurrency(computeProteinPerRsd(numericPrice, existing));
            existing.setMarket(store.getMarket() != null ? store.getMarket() : "rs");
            existing.setCurrency(store.getCurrency() != null ? store.getCurrency() : "RSD");
            // Recomputed from the merged row and stored even when null: a product that is no longer
            // scoreable (bad protein %, implausible price) must not keep its old score.
            Double updatedScore = calculateValueScore(numericPrice, existing);
            existing.setValueScore(updatedScore);
            if (updatedScore == null) existing.setPercentileRank(null);
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
            scraped.setProductType(profile.code());
            scraped.setNumericPrice(numericPrice);
            scraped.setValueScore(valueScore);
            if (weightGrams > 0) scraped.setPrimaryWeightGrams(weightGrams);
            scraped.setProteinPerRsd(computeProteinPerRsd(numericPrice, scraped));
            scraped.setProteinPerCurrency(computeProteinPerRsd(numericPrice, scraped));
            scraped.setCanonicalSlug(slugifyWithWeight(scraped.getName(), weightGrams > 0 ? weightGrams : null, store.getMarket()));
            productRepository.save(scraped);
            if (scraped.getId() != null) claimedProductIds.add(scraped.getId());
            productGroupService.tryAutoAssign(scraped);
            log.info("[{}] New product saved: '{}'", store.getName(), scraped.getName());
            return true;
        }
    }

    /**
     * Whether a URL-changed fallback may re-point {@code candidate} at the item being saved:
     * the row must not already belong to another item of this run, and the price must be nearly
     * unchanged (a real SKU change keeps its price; a different product doesn't).
     */
    private boolean isRepointAllowed(Product candidate, Double scrapedPrice, Set<Long> claimedProductIds) {
        if (candidate.getId() != null && claimedProductIds.contains(candidate.getId())) return false;
        return PriceIntegrity.isSafeRepoint(candidate.getNumericPrice(), scrapedPrice);
    }

    // -------------------- Score calculation --------------------
    // All formula / eligibility / benchmark logic lives in ValueScoreCalculator (pure, unit-tested).
    // A null result means the product can't be fairly scored (see ValueScoreCalculator.SkipReason)
    // and callers MUST store that null — keeping an older score would resurrect a stale/wrong one.

    private double brandScoreFor(Product p) {
        if (p.getBrand() == null || p.getBrand().isBlank()) return ValueScoreCalculator.DEFAULT_BRAND_SCORE;
        return brandReputationRepository
                .findFirstByBrandNameIgnoreCase(p.getBrand())
                .map(BrandReputation::getScore)
                .orElse(ValueScoreCalculator.DEFAULT_BRAND_SCORE);
    }

    public Double calculateValueScore(Double numericPrice, Product p) {
        return ValueScoreCalculator.score(numericPrice, p, brandScoreFor(p));
    }

    public Double calculateValueScore(Double numericPrice, Product p, double brandScore) {
        return ValueScoreCalculator.score(numericPrice, p, brandScore);
    }

    public ValueScoreBreakdown computeValueScoreBreakdown(Double numericPrice, Product p) {
        return ValueScoreCalculator.breakdown(numericPrice, p, brandScoreFor(p));
    }

    public ValueScoreBreakdown computeValueScoreBreakdown(Double numericPrice, Product p, double brandScore) {
        return ValueScoreCalculator.breakdown(numericPrice, p, brandScore);
    }

    public Double computeProteinPerRsd(Double numericPrice, Product p) {
        if (numericPrice == null || numericPrice <= 0) return null;
        if (p.getProteinPer100g() == null || p.getPrimaryWeightGrams() == null
                || p.getPrimaryWeightGrams() <= 0) return null;
        return (p.getProteinPer100g() / 100.0 * p.getPrimaryWeightGrams()) / numericPrice;
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
        return ValueScoreCalculator.extractPackageGrams(p);
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