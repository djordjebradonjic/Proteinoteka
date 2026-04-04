package com.proteinoteka.scheduler;

import com.proteinoteka.service.ScraperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class ScrapingScheduler {
    private final ScraperService scraperService;

    @Scheduled(cron = "0 0 3 * * MON")
    public void weeklyScrap() {
        log.info("--- Weekly scheduled scraping started ---");
        scraperService.scrapeAll();
        log.info("--- Weekly scheduled scraping finished ---");
    }
}
