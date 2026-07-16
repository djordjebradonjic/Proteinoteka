package com.proteinoteka.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record CalculatorStatsDTO(
        long total,
        Map<String, Long> byGoal,
        Map<String, Long> byMarket,
        List<RecentSubscriber> recent
) {
    public record RecentSubscriber(
            String email,
            String name,
            String goal,
            String market,
            LocalDateTime createdAt
    ) {}
}
