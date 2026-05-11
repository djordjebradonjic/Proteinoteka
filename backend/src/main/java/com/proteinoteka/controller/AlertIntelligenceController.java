package com.proteinoteka.controller;

import com.proteinoteka.analytics.AlertMetrics;
import com.proteinoteka.analytics.DecisionRulesEngine;
import com.proteinoteka.analytics.GrowthScore;
import com.proteinoteka.analytics.GrowthScoreService;
import com.proteinoteka.analytics.MetricsCollectorService;
import com.proteinoteka.analytics.UserSegmentService;
import com.proteinoteka.analytics.UserSegmentStats;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Admin-only intelligence endpoints.
 * Protected by AdminTokenFilter (same as /api/admin/**).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AlertIntelligenceController {

    private final MetricsCollectorService metricsCollector;
    private final DecisionRulesEngine rulesEngine;
    private final UserSegmentService segmentService;
    private final GrowthScoreService growthScoreService;

    /**
     * Returns all active decision flags with severity, message, and actionable recommendation.
     * Flags are only generated when metric thresholds are crossed — no noise when healthy.
     */
    @GetMapping("/decision-rules")
    public ResponseEntity<Map<String, Object>> decisionRules() {
        AlertMetrics metrics = metricsCollector.collect();
        var rules = rulesEngine.evaluate(metrics);

        return ResponseEntity.ok(Map.of(
                "evaluated", rules.size(),
                "rules", rules
        ));
    }

    /**
     * Segments users into four behavioral groups with CTR and strategic notes.
     */
    @GetMapping("/user-segments")
    public ResponseEntity<List<UserSegmentStats>> userSegments() {
        return ResponseEntity.ok(segmentService.buildSegments());
    }

    /**
     * Single composite Growth Health Score (0–100) with factor breakdown and summary.
     */
    @GetMapping("/growth-score")
    public ResponseEntity<GrowthScore> growthScore() {
        AlertMetrics metrics = metricsCollector.collect();
        return ResponseEntity.ok(growthScoreService.compute(metrics));
    }
}
