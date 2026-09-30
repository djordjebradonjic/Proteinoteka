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
     * Runs every day at 00:05 Belgrade time (moved from 06:50 so every scrape window — now all
     * between 00:00-06:00, see {@link ScrapingSchedulerService.ScrapeWindow} — is still ahead of
     * this check on the same calendar day).
     * Determines which stores to scrape today (based on 7-day cycle) and
     * schedules them at a random time within their configured window.
     */
    @Scheduled(cron = "0 5 0 * * *", zone = "Europe/Belgrade")
    public void dailyCheck() {
        schedulerService.runDailyCheck();
    }

    /**
     * Runs hourly as a safety net for dailyCheck(). If a redeploy/restart happens between
     * 00:05 and a store's scheduled scrape time, the in-memory scheduled task is lost silently
     * (no log, no error) — this catches it and runs the missed scrape once its window has closed.
     */
    @Scheduled(cron = "0 10 * * * *", zone = "Europe/Belgrade")
    public void catchUpCheck() {
        schedulerService.runCatchUpCheck();
    }

    /**
     * Runs weekly, Sunday 07:00 Belgrade time — after the 00:00-06:00 scrape windows have closed
     * (moved from 04:00, which used to be off-peak but now sits in the middle of them and would
     * contend for the same browser/proxy resources).
     * Catches products whose detail page 404s even though they're still listed on the
     * store's category page (so the normal per-store stale-removal pass never sees them).
     */
    @Scheduled(cron = "0 0 7 * * SUN", zone = "Europe/Belgrade")
    public void deadLinkCheck() {
        log.info("[Scheduler] Starting weekly dead-link check");
        deadLinkCheckService.removeDeadLinks();
    }
}
