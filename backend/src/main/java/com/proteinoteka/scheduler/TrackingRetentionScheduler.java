package com.proteinoteka.scheduler;

import com.proteinoteka.repository.ClickEventRepository;
import com.proteinoteka.repository.TrackingEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class TrackingRetentionScheduler {

    private static final int RETENTION_DAYS = 90;

    private final TrackingEventRepository trackingEventRepository;
    private final ClickEventRepository clickEventRepository;

    /**
     * Runs daily at 04:15 Belgrade time, ahead of the scraping job.
     * Enforces the retention period disclosed in the privacy policy for
     * usage-analytics data (tracking_events / click_events).
     */
    @Scheduled(cron = "0 15 4 * * *", zone = "Europe/Belgrade")
    public void purgeExpiredEvents() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deletedTracking = trackingEventRepository.deleteByCreatedAtBefore(cutoff);
        int deletedClicks = clickEventRepository.deleteByCreatedAtBefore(cutoff);
        log.info("Tracking retention purge: deleted {} tracking_events and {} click_events older than {} days",
                deletedTracking, deletedClicks, RETENTION_DAYS);
    }
}
