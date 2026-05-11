package com.proteinoteka.analytics;

import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Computes the Growth Health Score (0–100) from an AlertMetrics snapshot.
 *
 * Weights:
 *   email_open_rate    20 pts  — top-of-funnel signal
 *   click_rate         20 pts  — value proposition signal
 *   conversion_rate    30 pts  — UX friction signal (largest weight; uses neutral 0.5 if unknown)
 *   repeat_users       20 pts  — retention signal
 *   unsubscribe_rate  −10 pts  — audience fit signal (penalty)
 *
 * Benchmarks (= 100% of available points):
 *   open_rate ≥ 35%  |  click_rate ≥ 20%  |  conversion ≥ 50%
 *   repeat_rate ≥ 30%  |  unsub_rate = 0%  (penalty grows to full 10 pts at 5%)
 */
@Service
public class GrowthScoreService {

    private static final double BENCHMARK_OPEN       = 0.35;
    private static final double BENCHMARK_CLICK      = 0.20;
    private static final double BENCHMARK_CONVERSION = 0.50;
    private static final double BENCHMARK_REPEAT     = 0.30;
    private static final double BENCHMARK_UNSUB_MAX  = 0.05;  // full penalty at 5%

    public GrowthScore compute(AlertMetrics m) {
        double openScore       = cap(m.openRate()       / BENCHMARK_OPEN)       * 20;
        double clickScore      = cap(m.clickRate()      / BENCHMARK_CLICK)      * 20;
        double convScore       = cap(convRate(m)        / BENCHMARK_CONVERSION) * 30;
        double repeatScore     = cap(m.repeatUserRate() / BENCHMARK_REPEAT)     * 20;
        double unsubPenalty    = cap(m.unsubscribeRate() / BENCHMARK_UNSUB_MAX) * 10;

        int score = (int) Math.round(openScore + clickScore + convScore + repeatScore - unsubPenalty);
        score = Math.max(0, Math.min(100, score));

        GrowthScore.Status status =
                score >= 70 ? GrowthScore.Status.HEALTHY :
                score >= 40 ? GrowthScore.Status.WARNING :
                              GrowthScore.Status.CRITICAL;

        List<GrowthScore.ScoreFactor> factors = List.of(
                factor("Email open rate",    m.openRate()       * 100, openScore,    20,
                        openNote(m.openRate())),
                factor("Email click rate",   m.clickRate()      * 100, clickScore,   20,
                        clickNote(m.clickRate())),
                factor("Conversion rate",    convRate(m)        * 100, convScore,    30,
                        m.conversionRate() == null ? "Not measured yet (GA4 only)" : convNote(convRate(m))),
                factor("Repeat users",       m.repeatUserRate() * 100, repeatScore,  20,
                        repeatNote(m.repeatUserRate())),
                factor("Unsubscribe rate",   m.unsubscribeRate()* 100, -unsubPenalty, 0,
                        unsubNote(m.unsubscribeRate()))
        ).stream()
         .sorted(Comparator.comparingDouble(f -> f.maxPoints() - f.earnedPoints()))
         .toList();

        String summary = buildSummary(score, status, factors);

        return new GrowthScore(score, status, factors, summary);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private static double convRate(AlertMetrics m) {
        return m.conversionRate() != null ? m.conversionRate() : 0.35;
    }

    private static double cap(double v) { return Math.min(v, 1.0); }

    private static GrowthScore.ScoreFactor factor(
            String name, double currentPct, double earned, double max, String note) {
        return new GrowthScore.ScoreFactor(
                name,
                Math.round(currentPct * 10.0) / 10.0,
                Math.round(earned * 10.0) / 10.0,
                max,
                note
        );
    }

    private static String buildSummary(int score, GrowthScore.Status status,
                                       List<GrowthScore.ScoreFactor> factors) {
        String worstFactor = factors.stream()
                .filter(f -> f.maxPoints() > 0)
                .min(Comparator.comparingDouble(f -> f.earnedPoints() / f.maxPoints()))
                .map(GrowthScore.ScoreFactor::name)
                .orElse("N/A");

        return switch (status) {
            case HEALTHY  -> String.format(
                    "System is healthy at %d/100. Biggest growth lever: %s.", score, worstFactor);
            case WARNING  -> String.format(
                    "Score %d/100 — needs attention. Prioritize improving %s.", score, worstFactor);
            case CRITICAL -> String.format(
                    "Critical score %d/100. Immediate action required on %s.", score, worstFactor);
        };
    }

    private static String openNote(double v) {
        if (v < 0.20) return "Below threshold — check subject lines and send timing";
        if (v < 0.35) return "On track — approaching benchmark";
        return "Above benchmark — email quality is strong";
    }

    private static String clickNote(double v) {
        if (v < 0.10) return "Below threshold — review CTA copy and price presentation";
        if (v < 0.20) return "On track — approaching benchmark";
        return "Above benchmark — high purchase intent from emails";
    }

    private static String convNote(double v) {
        if (v < 0.20) return "Below threshold — reduce modal friction";
        if (v < 0.50) return "On track — room to improve email prefill and UX";
        return "Above benchmark — modal conversion is excellent";
    }

    private static String repeatNote(double v) {
        if (v < 0.25) return "Below threshold — encourage users to add more alerts";
        return "Above benchmark — strong product-market fit signal";
    }

    private static String unsubNote(double v) {
        if (v > 0.05) return "High unsubscribe — review alert relevance and drop thresholds";
        if (v > 0.02) return "Acceptable — monitor closely";
        return "Low — audience is well-matched";
    }
}
