package com.proteinoteka.controller;

import com.proteinoteka.analytics.DecisionRulesEngine;
import com.proteinoteka.analytics.MetricsCollectorService;
import com.proteinoteka.model.AlertStatus;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.ScrapeLog;
import com.proteinoteka.repository.AlertJobRepository;
import com.proteinoteka.repository.AlertUnsubscribeRepository;
import com.proteinoteka.repository.BrandReputationRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import com.proteinoteka.scheduler.ScrapingSchedulerService;
import com.proteinoteka.dto.NutritionDataDTO;
import com.proteinoteka.service.AiNutritionService;
import com.proteinoteka.service.ScraperService;
import com.proteinoteka.service.PolleoSportScraper;
import com.proteinoteka.service.ShopbuilderScraper;
import com.proteinoteka.service.StoreScraper;
import com.proteinoteka.service.SupplementStoreScraper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    @Value("${app.frontend-url:}")
    private String frontendUrl;

    @Value("${admin.token:}")
    private String adminToken;

    private final ScraperService scraperService;
    private final List<StoreScraper> scrapers;
    private final ProductRepository productRepository;
    private final ScrapingSchedulerService schedulerService;
    private final BrandReputationRepository brandReputationRepository;
    private final CacheManager cacheManager;
    private final AlertJobRepository alertJobRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final AlertUnsubscribeRepository alertUnsubscribeRepository;
    private final MetricsCollectorService metricsCollector;
    private final DecisionRulesEngine rulesEngine;
    private final AiNutritionService aiNutritionService;
    private final com.proteinoteka.service.DataQualityService dataQualityService;


    // All scrape endpoints run in a background thread and return 202 immediately.
    // Railway (and any reverse proxy) has a ~5 min HTTP timeout; scrapers run for hours.

    @PostMapping("/scrape")
    public ResponseEntity<String> triggerScrape(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-all", () -> scraperService.scrapeAll(testMode));
        return ResponseEntity.accepted().body("All scrapers started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/run")
    public ResponseEntity<String> runScraper(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-all", () -> scraperService.scrapeAll(testMode));
        return ResponseEntity.accepted().body("All scrapers started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/pansport")
    public ResponseEntity<String> scrapePansport() {
        runAsync("scraper-pansport", () -> schedulerService.scrapeStoreNow("Pansport"));
        return ResponseEntity.accepted().body("Pansport scraping started in background");
    }

    @PostMapping("/scrape/proteinbox")
    public ResponseEntity<String> scrapeProteinbox() {
        runAsync("scraper-proteinbox", () -> schedulerService.scrapeStoreNow("Proteinbox"));
        return ResponseEntity.accepted().body("Proteinbox scraping started in background");
    }

    @PostMapping("/scrape/supplementshop")
    public ResponseEntity<String> scrapeSupplementShop() {
        runAsync("scraper-supplementshop", () -> schedulerService.scrapeStoreNow("Supplementshop"));
        return ResponseEntity.accepted().body("Supplementshop scraping started in background");
    }

    @PostMapping("/scrape/ogistra")
    public ResponseEntity<String> scrapeOgistra() {
        runAsync("scraper-ogistra", () -> schedulerService.scrapeStoreNow("Ogistrashop"));
        return ResponseEntity.accepted().body("Ogistrashop scraping started in background");
    }

    @PostMapping("/scrape/fitlab")
    public ResponseEntity<String> scrapeFitLab() {
        runAsync("scraper-fitlab", () -> schedulerService.scrapeStoreNow("FitLab"));
        return ResponseEntity.accepted().body("FitLab scraping started in background");
    }

    @PostMapping("/scrape/proteinisi")
    public ResponseEntity<String> scrapeProteiniSi() {
        runAsync("scraper-proteinisi", () -> schedulerService.scrapeStoreNow("Proteini.si"));
        return ResponseEntity.accepted().body("Proteini.si scraping started in background");
    }

    @PostMapping("/scrape/gymbeam")
    public ResponseEntity<String> scrapeGymBeam() {
        runAsync("scraper-gymbeam", () -> schedulerService.scrapeStoreNow("GymBeam"));
        return ResponseEntity.accepted().body("GymBeam scraping started in background");
    }

    @PostMapping("/scrape/myprotein")
    public ResponseEntity<String> scrapeMyProtein() {
        runAsync("scraper-myprotein", () -> schedulerService.scrapeStoreNow("MyProtein"));
        return ResponseEntity.accepted().body("MyProtein scraping started in background");
    }

    @PostMapping("/scrape/myprotein-hr")
    public ResponseEntity<String> scrapeMyProteinHr() {
        runAsync("scraper-myprotein-hr", () -> schedulerService.scrapeStoreNow("MyProtein HR"));
        return ResponseEntity.accepted().body("MyProtein HR scraping started in background");
    }

    @PostMapping("/scrape/nutrition-shop-hr")
    public ResponseEntity<String> scrapeNutritionShopHr() {
        runAsync("scraper-nutrition-shop-hr", () -> schedulerService.scrapeStoreNow("Nutrition Shop HR"));
        return ResponseEntity.accepted().body("Nutrition Shop HR scraping started in background");
    }

    @PostMapping("/scrape/lama")
    public ResponseEntity<String> scrapeLama() {
        runAsync("scraper-lama", () -> schedulerService.scrapeStoreNow("Lama"));
        return ResponseEntity.accepted().body("Lama scraping started in background");
    }

    @PostMapping("/scrape/shopbuilder")
    public ResponseEntity<String> scrapeShopbuilder() {
        runAsync("scraper-shopbuilder", () -> schedulerService.scrapeStoreNow("Shopbuilder"));
        return ResponseEntity.accepted().body("Shopbuilder scraping started in background");
    }

    @PostMapping("/scrape/shopbuilder/test")
    public ResponseEntity<String> scrapeShopbuilderTest(
            @RequestParam(defaultValue = "10") int limit) {
        ShopbuilderScraper scraper = scrapers.stream()
                .filter(s -> s instanceof ShopbuilderScraper)
                .map(s -> (ShopbuilderScraper) s)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Shopbuilder scraper not found"));
        scraper.setProductLimit(limit);
        runAsync("scraper-shopbuilder-test", () -> {
            try {
                scraperService.scrapeStore(scraper, true);
            } finally {
                scraper.resetProductLimit();
            }
        });
        return ResponseEntity.accepted().body("Shopbuilder TEST scrape started — limit: " + limit + " products");
    }

    @PostMapping("/scrape/xsport")
    public ResponseEntity<String> scrapeXSport() {
        runAsync("scraper-xsport", () -> schedulerService.scrapeStoreNow("XSport"));
        return ResponseEntity.accepted().body("XSport scraping started in background");
    }

    @PostMapping("/scrape/supplementstore")
    public ResponseEntity<String> scrapeSupplementStore() {
        runAsync("scraper-supplementstore", () -> schedulerService.scrapeStoreNow("SupplementStore"));
        return ResponseEntity.accepted().body("SupplementStore scraping started in background");
    }

    @PostMapping("/scrape/supplementstore/test")
    public ResponseEntity<String> scrapeSupplementStoreTest(
            @RequestParam(defaultValue = "10") int limit) {
        SupplementStoreScraper scraper = scrapers.stream()
                .filter(s -> s instanceof SupplementStoreScraper)
                .map(s -> (SupplementStoreScraper) s)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("SupplementStore scraper not found"));
        scraper.setProductLimit(limit);
        runAsync("scraper-supplementstore-test", () -> {
            try {
                scraperService.scrapeStore(scraper, true);
            } finally {
                scraper.resetProductLimit();
            }
        });
        return ResponseEntity.accepted().body("SupplementStore TEST scrape started — limit: " + limit + " products");
    }

    @PostMapping("/scrape/polleo-sport-hr")
    public ResponseEntity<String> scrapePolleoSportHr() {
        runAsync("scraper-polleo-sport-hr", () -> schedulerService.scrapeStoreNow("Polleo Sport"));
        return ResponseEntity.accepted().body("Polleo Sport HR scraping started in background");
    }

    @PostMapping("/scrape/proteka-hr")
    public ResponseEntity<String> scrapeProtekaHr() {
        runAsync("scraper-proteka-hr", () -> schedulerService.scrapeStoreNow("Proteka"));
        return ResponseEntity.accepted().body("Proteka HR scraping started in background");
    }

    @PostMapping("/scrape/polleo-sport-hr/test")
    public ResponseEntity<String> scrapePolleoSportHrTest(
            @RequestParam(defaultValue = "3") int limit) {
        PolleoSportScraper scraper = scrapers.stream()
                .filter(s -> s instanceof PolleoSportScraper)
                .map(s -> (PolleoSportScraper) s)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("PolleoSport scraper not found"));
        scraper.setProductLimit(limit);
        runAsync("scraper-polleo-sport-hr-test", () -> {
            try {
                scraperService.scrapeStore(scraper, true);
            } finally {
                scraper.resetProductLimit();
            }
        });
        return ResponseEntity.accepted().body("Polleo Sport HR TEST scrape started — limit: " + limit + " products");
    }

    private void runAsync(String threadName, Runnable task) {
        Thread t = Executors.defaultThreadFactory().newThread(task);
        t.setName(threadName);
        t.setDaemon(true);
        t.start();
    }

    private StoreScraper findScraper(String name) {
        return scrapers.stream()
                .filter(s -> s.getStoreName().equals(name))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(name + " scraper not found"));
    }

    @PostMapping("/scrape/store/{storeName}")
    public ResponseEntity<ScrapeLog> triggerStoreScrape(@PathVariable String storeName) {
        ScrapeLog result = schedulerService.scrapeStoreNow(storeName);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/scrape/status")
    public ResponseEntity<?> scrapeStatus() {
        return ResponseEntity.ok(Map.of(
                "cycleDay", schedulerService.currentCycleDay(),
                "stores",   schedulerService.getStatus()
        ));
    }

    @GetMapping("/alert-metrics")
    public ResponseEntity<Map<String, Object>> alertMetrics() {
        var m        = metricsCollector.collect();
        var insights = rulesEngine.evaluate(m);

        long unsub30d = alertUnsubscribeRepository.countLast30Days();
        double ctoRate = m.jobsOpened() > 0 ? (double) m.jobsClicked() / m.jobsOpened() : 0;

        return ResponseEntity.ok(Map.of(
                "subscribers", Map.of(
                        "totalAlerts",      m.totalAlerts(),
                        "uniqueEmails",     m.uniqueEmails(),
                        "withTargetPrice",  m.withTargetPrice(),
                        "avgAlertsPerUser", Math.round(m.avgAlertsPerUser() * 100.0) / 100.0,
                        "repeatUsers",      m.repeatUsers()
                ),
                "jobs", Map.of(
                        "pending",     m.jobsPending(),
                        "sent",        m.jobsSent(),
                        "failed",      m.jobsFailed(),
                        "failureRate", Math.round(m.failureRate() * 10000.0) / 10000.0
                ),
                "email", Map.of(
                        "sent",            m.jobsSent(),
                        "opened",          m.jobsOpened(),
                        "clicked",         m.jobsClicked(),
                        "openRate",        Math.round(m.openRate()   * 10000.0) / 10000.0,
                        "clickRate",       Math.round(m.clickRate()  * 10000.0) / 10000.0,
                        "clickToOpenRate", Math.round(ctoRate         * 10000.0) / 10000.0
                ),
                "unsubscribes", Map.of(
                        "total",           m.totalUnsubscribes(),
                        "last30Days",      unsub30d,
                        "unsubscribeRate", Math.round(m.unsubscribeRate() * 10000.0) / 10000.0
                ),
                "insights", insights
        ));
    }

    @GetMapping("/alert-subscribers")
    public ResponseEntity<List<Map<String, Object>>> recentAlertSubscribers(
            @RequestParam(defaultValue = "30") int limit) {
        var items = wishlistItemRepository.findAll(
                PageRequest.of(0, Math.min(limit, 200), Sort.by("addedAt").descending())
        );

        Set<Long> productIds = items.getContent().stream()
                .map(w -> w.getProductId())
                .collect(Collectors.toSet());
        Map<Long, String> productNames = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));

        List<Map<String, Object>> result = items.getContent().stream().map(w -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("email", w.getEmail());
            m.put("productId", w.getProductId());
            m.put("productName", productNames.getOrDefault(w.getProductId(), "#" + w.getProductId()));
            m.put("targetPrice", w.getTargetPrice());
            m.put("addedAt", w.getAddedAt());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/recalculate-scores")
    public ResponseEntity<String> recalculateScores() {
        Map<String, Double> brandScores = brandReputationRepository.findAll().stream()
                .collect(Collectors.toMap(
                        b -> b.getBrandName().toLowerCase().trim(),
                        com.proteinoteka.model.BrandReputation::getScore,
                        (a, b) -> a
                ));

        List<Product> all = productRepository.findAll();
        int updated = 0;
        for (Product p : all) {
            double brandScore = p.getBrand() != null
                    ? brandScores.getOrDefault(p.getBrand().toLowerCase().trim(), 4.5)
                    : 4.5;
            Double newScore = scraperService.calculateValueScore(p.getNumericPrice(), p, brandScore);
            if (newScore != null) {
                p.setValueScore(newScore);
                updated++;
            }
            p.setProteinPerRsd(scraperService.computeProteinPerRsd(p.getNumericPrice(), p));
        }
        // Compute percentile ranks based on value score
        List<Product> withScore = all.stream()
                .filter(p -> p.getValueScore() != null)
                .sorted(java.util.Comparator.comparingDouble(Product::getValueScore))
                .toList();
        for (int i = 0; i < withScore.size(); i++) {
            int pct = (int) Math.round((double) i / withScore.size() * 100);
            withScore.get(i).setPercentileRank(pct);
        }

        productRepository.saveAll(all);
        List.of("products", "products-meta", "products-search").forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) cache.clear();
        });
        invalidateFrontendCache();
        return ResponseEntity.ok("Updated " + updated + " products");
    }

    @GetMapping("/data-quality")
    public ResponseEntity<Map<String, Object>> dataQuality() {
        var report = dataQualityService.generateReport();
        var outliers = dataQualityService.checkOutliers();
        return ResponseEntity.ok(Map.of("report", report, "outliers", outliers));
    }

    @PostMapping("/enrich-nutrition")
    public ResponseEntity<String> enrichNutrition() {
        List<Product> candidates = productRepository.findAll().stream()
                .filter(p -> (p.getSugarPer100g() == null || p.getFatPer100g() == null)
                        && p.getDescription() != null && !p.getDescription().isBlank())
                .toList();
        candidates.forEach(p -> p.getPackage_weight().size()); // force eager load while JPA session is open

        runAsync("enrich-nutrition", () -> {
            int updated = 0;
            for (Product p : candidates) {
                try {
                    NutritionDataDTO ai = aiNutritionService.extractNutritionData(
                            p.getName(), p.getDescription(), p.getPackage_weight());
                    if (ai == null) continue;

                    boolean changed = false;
                    if (p.getSugarPer100g() == null && ai.getSugarPer100g() != null) {
                        p.setSugarPer100g(ai.getSugarPer100g());
                        changed = true;
                    }
                    if (p.getFatPer100g() == null && ai.getFatPer100g() != null) {
                        p.setFatPer100g(ai.getFatPer100g());
                        changed = true;
                    }
                    if (p.getCaloriePer100g() == null && ai.getCaloriePer100g() != null) {
                        p.setCaloriePer100g(ai.getCaloriePer100g());
                        changed = true;
                    }
                    if (changed) {
                        productRepository.save(p);
                        updated++;
                    }
                } catch (Exception e) {
                    // continue with next product
                }
            }

            Map<String, Double> brandScores = brandReputationRepository.findAll().stream()
                    .collect(Collectors.toMap(
                            b -> b.getBrandName().toLowerCase().trim(),
                            com.proteinoteka.model.BrandReputation::getScore,
                            (a, b) -> a));
            List<Product> all = productRepository.findAll();
            for (Product p : all) {
                double brandScore = p.getBrand() != null
                        ? brandScores.getOrDefault(p.getBrand().toLowerCase().trim(), 4.5) : 4.5;
                Double newScore = scraperService.calculateValueScore(p.getNumericPrice(), p, brandScore);
                if (newScore != null) p.setValueScore(newScore);
                p.setProteinPerRsd(scraperService.computeProteinPerRsd(p.getNumericPrice(), p));
            }
            productRepository.saveAll(all);

            List.of("products", "products-meta", "products-search").forEach(name -> {
                var cache = cacheManager.getCache(name);
                if (cache != null) cache.clear();
            });
        });

        return ResponseEntity.accepted().body(
                "Nutrition enrichment started for " + candidates.size() + " products");
    }

    private void invalidateFrontendCache() {
        if (frontendUrl == null || frontendUrl.isBlank() || adminToken == null || adminToken.isBlank()) return;
        try {
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(frontendUrl + "/api/revalidate"))
                    .header("Authorization", "Bearer " + adminToken)
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            var response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Frontend cache invalidated: HTTP {}", response.statusCode());
        } catch (Exception e) {
            log.warn("Failed to invalidate frontend cache: {}", e.getMessage());
        }
    }
}