package com.proteinoteka.controller;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.ScrapeLog;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.scheduler.ScrapingSchedulerService;
import com.proteinoteka.service.ScraperService;
import com.proteinoteka.service.StoreScraper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ScraperService scraperService;
    private final List<StoreScraper> scrapers;
    private final ProductRepository productRepository;
    private final ScrapingSchedulerService schedulerService;


    @PostMapping("/scrape")
    public ResponseEntity<String> triggerScrape(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeAll(testMode);
        return ResponseEntity.ok("Scraping started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/run")
    public ResponseEntity<String> runScraper(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeAll(testMode);
        return ResponseEntity.ok("Scraper started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/pansport")
    public ResponseEntity<String> scrapePansport(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeStore(findScraper("Pansport"), testMode);
        return ResponseEntity.ok("Pansport scraping started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/proteinbox")
    public ResponseEntity<String> scrapeProteinbox(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeStore(findScraper("Proteinbox"), testMode);
        return ResponseEntity.ok("Proteinbox scraping started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/supplementshop")
    public ResponseEntity<String> scrapeSupplementShop(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeStore(findScraper("Supplementshop"), testMode);
        return ResponseEntity.ok("Supplementshop scraping started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/ogistra")
    public ResponseEntity<String> scrapeOgistra(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeStore(findScraper("Ogistrashop"), testMode);
        return ResponseEntity.ok("Ogistrashop scraping started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/fitlab")
    public ResponseEntity<String> scrapeFitLab(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeStore(findScraper("FitLab"), testMode);
        return ResponseEntity.ok("FitLab scraping started" + (testMode ? " [TEST MODE]" : ""));
    }

    @PostMapping("/scrape/proteinisi")
    public ResponseEntity<String> scrapeProteiniSi(
            @RequestParam(defaultValue = "false") boolean testMode) {
        scraperService.scrapeStore(findScraper("Proteini.si"), testMode);
        return ResponseEntity.ok("Proteini.si scraping started" + (testMode ? " [TEST MODE]" : ""));
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

    @PostMapping("/recalculate-scores")
    public ResponseEntity<String> recalculateScores() {
        List<Product> all = productRepository.findAll();
        int updated = 0;
        for (Product p : all) {
            Double newScore = scraperService.calculateValueScore(p.getNumericPrice(), p);
            if (newScore != null) {
                p.setValueScore(newScore);
                productRepository.save(p);
                updated++;
            }
        }
        return ResponseEntity.ok("Updated " + updated + " products");
    }
}