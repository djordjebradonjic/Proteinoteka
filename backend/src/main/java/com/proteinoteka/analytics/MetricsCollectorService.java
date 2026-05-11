package com.proteinoteka.analytics;

import com.proteinoteka.model.AlertStatus;
import com.proteinoteka.repository.AlertJobRepository;
import com.proteinoteka.repository.AlertUnsubscribeRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Aggregates all raw metrics from DB into a single AlertMetrics snapshot.
 * conversionRate and avgTimeToCreateMs can be injected via application.yml
 * after reading them from GA4 (they are frontend-only events).
 */
@Service
@RequiredArgsConstructor
public class MetricsCollectorService {

    private final WishlistItemRepository wishlistRepo;
    private final AlertJobRepository alertJobRepo;
    private final AlertUnsubscribeRepository unsubRepo;

    @Value("${analytics.conversion-rate:#{null}}")
    private Double externalConversionRate;

    @Value("${analytics.avg-time-to-create-ms:#{null}}")
    private Double externalAvgTimeToCreateMs;

    public AlertMetrics collect() {
        long totalAlerts  = wishlistRepo.countTotal();
        long uniqueEmails = wishlistRepo.countUniqueEmails();
        long withTarget   = wishlistRepo.countWithTargetPrice();
        double avgPerUser = wishlistRepo.avgAlertsPerUser();
        long repeatUsers  = wishlistRepo.countRepeatUsers();

        long pending  = alertJobRepo.countByStatus(AlertStatus.PENDING);
        long sent     = alertJobRepo.countByStatus(AlertStatus.SENT);
        long failed   = alertJobRepo.countByStatus(AlertStatus.FAILED);
        long opened   = alertJobRepo.countOpened();
        long clicked  = alertJobRepo.countClicked();

        long totalUnsubs = unsubRepo.count();

        double openRate       = sent > 0 ? (double) opened  / sent : 0;
        double clickRate      = sent > 0 ? (double) clicked / sent : 0;
        double failureRate    = (sent + failed) > 0 ? (double) failed / (sent + failed) : 0;
        double unsubRate      = sent > 0 ? (double) totalUnsubs / sent : 0;
        double repeatUserRate = uniqueEmails > 0 ? (double) repeatUsers / uniqueEmails : 0;

        return new AlertMetrics(
                totalAlerts, uniqueEmails, withTarget, avgPerUser, repeatUsers,
                pending, sent, failed, opened, clicked, totalUnsubs,
                openRate, clickRate, failureRate, unsubRate, repeatUserRate,
                externalConversionRate,
                externalAvgTimeToCreateMs
        );
    }
}
