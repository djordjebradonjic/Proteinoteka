package com.proteinoteka.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record NewsletterStatsDTO(
        long total,
        Map<String, Long> bySource,
        Map<String, Long> byMarket,
        List<RecentSubscriber> recent
) {
    public record RecentSubscriber(
            String email,
            String source,
            String market,
            LocalDateTime createdAt
    ) {}
}
