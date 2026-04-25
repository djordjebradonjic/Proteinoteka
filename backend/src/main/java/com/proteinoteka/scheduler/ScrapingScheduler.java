package com.proteinoteka.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class ScrapingScheduler {

    private final ScrapingSchedulerService schedulerService;

    /**
     * Runs every day at 06:50 Belgrade time.
     * Determines which stores to scrape today (based on 9-day cycle) and
     * schedules them at a random time within their configured window.
     */
    @Scheduled(cron = "0 50 6 * * *", zone = "Europe/Belgrade")
    public void dailyCheck() {
        schedulerService.runDailyCheck();
    }
}
