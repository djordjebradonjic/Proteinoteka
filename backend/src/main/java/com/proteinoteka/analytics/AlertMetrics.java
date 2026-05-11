package com.proteinoteka.analytics;

/**
 * Immutable snapshot of all price alert metrics at a point in time.
 * Built by MetricsCollectorService from live DB data.
 * conversionRate and avgTimeToCreateMs are GA4-sourced and may be null.
 */
public record AlertMetrics(
        // subscriber state
        long totalAlerts,
        long uniqueEmails,
        long withTargetPrice,
        double avgAlertsPerUser,
        long repeatUsers,

        // job pipeline
        long jobsPending,
        long jobsSent,
        long jobsFailed,
        long jobsOpened,
        long jobsClicked,
        long totalUnsubscribes,

        // derived rates (always computed, never null)
        double openRate,
        double clickRate,
        double failureRate,
        double unsubscribeRate,
        double repeatUserRate,

        // optional: sourced from GA4 export or application.yml override
        Double conversionRate,
        Double avgTimeToCreateMs
) {}
