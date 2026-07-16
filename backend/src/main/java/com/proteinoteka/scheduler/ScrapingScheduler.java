package com.proteinoteka.scheduler;

import com.proteinoteka.service.DeadLinkCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class ScrapingScheduler {

    private final ScrapingSchedulerService schedulerService;
    private final DeadLinkCheckService deadLinkCheckService;

    /**
     * Runs every day at 06:50 Belgrade time.
     * Determines which stores to scrape today (based on 9-day cycle) and
     * schedules them at a random time within their configured window.
     */
    @Scheduled(cron = "0 50 6 * * *", zone = "Europe/Belgrade")
    public void dailyCheck() {
        schedulerService.runDailyCheck();
    }

    /**
     * Runs weekly, Sunday 04:00 Belgrade time — off-peak, before the daily scrape check.
     * Catches products whose detail page 404s even though they're still listed on the
     * store's category page (so the normal per-store stale-removal pass never sees them).
     */
    @Scheduled(cron = "0 0 4 * * SUN", zone = "Europe/Belgrade")
    public void deadLinkCheck() {
        log.info("[Scheduler] Starting weekly dead-link check");
        deadLinkCheckService.removeDeadLinks();
    }
}
