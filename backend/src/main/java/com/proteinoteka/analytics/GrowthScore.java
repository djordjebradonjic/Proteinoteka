package com.proteinoteka.analytics;

import java.util.List;

public record GrowthScore(
        int score,           // 0–100
        Status status,
        List<ScoreFactor> factors,  // all factors, sorted by impact gap
        String summary              // one-line human-readable verdict
) {
    public enum Status { HEALTHY, WARNING, CRITICAL }

    public record ScoreFactor(
            String name,
            double currentPct,     // current metric value as percentage
            double earnedPoints,   // points this factor contributes (0–maxPoints)
            double maxPoints,
            String note
    ) {}
}
