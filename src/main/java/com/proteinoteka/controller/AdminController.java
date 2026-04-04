package com.proteinoteka.controller;


import com.proteinoteka.service.ScraperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ScraperService scraperService;

    @PostMapping("/scrape")
    public ResponseEntity<String> triggerScrape() {
        scraperService.scrapeAll();
        return ResponseEntity.ok("Scraping started");
    }
}
