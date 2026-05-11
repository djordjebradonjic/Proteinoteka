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
import com.proteinoteka.service.ScraperService;
import com.proteinoteka.service.StoreScraper;
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
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

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
    public ResponseEntity<String> scrapePansport(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-pansport", () -> scraperService.scrapeStore(findScraper("Pansport"), testMode));
        return ResponseEntity.accepted().body("Pansport scraping started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/proteinbox")
    public ResponseEntity<String> scrapeProteinbox(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-proteinbox", () -> scraperService.scrapeStore(findScraper("Proteinbox"), testMode));
        return ResponseEntity.accepted().body("Proteinbox scraping started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/supplementshop")
    public ResponseEntity<String> scrapeSupplementShop(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-supplementshop", () -> scraperService.scrapeStore(findScraper("Supplementshop"), testMode));
        return ResponseEntity.accepted().body("Supplementshop scraping started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/ogistra")
    public ResponseEntity<String> scrapeOgistra(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-ogistra", () -> scraperService.scrapeStore(findScraper("Ogistrashop"), testMode));
        return ResponseEntity.accepted().body("Ogistrashop scraping started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/fitlab")
    public ResponseEntity<String> scrapeFitLab(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-fitlab", () -> scraperService.scrapeStore(findScraper("FitLab"), testMode));
        return ResponseEntity.accepted().body("FitLab scraping started in background" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/proteinisi")
    public ResponseEntity<String> scrapeProteiniSi(
            @RequestParam(defaultValue = "false") boolean testMode) {
        runAsync("scraper-proteinisi", () -> scraperService.scrapeStore(findScraper("Proteini.si"), testMode));
        return ResponseEntity.accepted().body("Proteini.si scraping started in background" + (testMode ? " [TEST MODE]" : ""));
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
        productRepository.saveAll(all);
        List.of("products", "products-meta", "products-search").forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) cache.clear();
        });
        return ResponseEntity.ok("Updated " + updated + " products");
    }
}