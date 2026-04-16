package com.proteinoteka.controller;


import com.proteinoteka.service.ScraperService;
import com.proteinoteka.service.StoreScraper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ScraperService scraperService;
    private final List<StoreScraper> scrapers;

    @PostMapping("/scrape")
    public ResponseEntity<String> triggerScrape() {
        scraperService.scrapeAll();
        return ResponseEntity.ok("Scraping started");
    }

    @PostMapping("/scrape/pansport")
    public ResponseEntity<String> scrapePansport() {
        scraperService.scrapeStore(scrapers.stream()
                .filter(s -> s.getStoreName().equals("Pansport"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Pansport scraper not found")));
        return ResponseEntity.ok("Pansport scraping started");
    }

    @PostMapping("/scrape/proteinbox")
    public ResponseEntity<String> scrapeProteinbox() {
        scraperService.scrapeStore(scrapers.stream()
                .filter(s -> s.getStoreName().equals("Proteinbox"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Proteinbox scraper not found")));
        return ResponseEntity.ok("Proteinbox scraping started");
    }

    @PostMapping("/scrape/supplementshop")
    public ResponseEntity<String> scrapeSupplementShop() {
        scraperService.scrapeStore(scrapers.stream()
                .filter(s -> s.getStoreName().equals("Supplementshop"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Supplementshop scraper not found")));
        return ResponseEntity.ok("Supplementshop scraping started");
    }

}
