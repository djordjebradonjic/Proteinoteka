package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.ValueScoreCalculator.Evaluation;
import com.proteinoteka.service.ValueScoreCalculator.SkipReason;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Read-only consistency audit of everything the value score depends on. Pure (no Spring/DB) so it
 * is unit-testable; DataQualityService feeds it the catalogue and surfaces the findings.
 *
 * <p>Each finding is one line {@code CODE — id=… [market] 'name' …}. The point is that the kind of
 * error behind a wrong score (bad protein %, wrong weight, bogus price, stale score, unknown brand,
 * drifted benchmark) is visible right after it enters the data instead of months later.
 */
public final class ValueScoreAudit {

    private ValueScoreAudit() {}

    /** Price per gram of protein this far from the same-type median is worth a human look. */
    static final double PRICE_OUTLIER_LOW = 0.4;
    static final double PRICE_OUTLIER_HIGH = 2.5;

    /** Benchmark deviating from the cleaned median by more than this is "drifted". */
    static final double BENCHMARK_DRIFT_TOLERANCE = 0.25;
    static final int BENCHMARK_MIN_SAMPLE = 15;

    static final double STORED_SCORE_TOLERANCE = 0.2;
    static final double WEIGHT_NAME_TOLERANCE = 0.08;

    public static List<String> run(List<Product> products, Map<String, Double> brandScoresLowercase) {
        List<String> issues = new ArrayList<>();
        List<Product> protein = products.stream()
                .filter(p -> !"creatine".equals(p.getProductType()))
                .toList();

        // effectiveSource + market -> price/g-protein of cleanly scored products (for medians/outliers)
        Map<String, List<Double>> pricesBySegment = new HashMap<>();
        Map<Long, Evaluation> evals = new HashMap<>();
        Map<Long, Double> ppgById = new HashMap<>();

        for (Product p : protein) {
            double brandScore = brandScore(p, brandScoresLowercase);
            Evaluation ev = ValueScoreCalculator.evaluate(p.getNumericPrice(), p, brandScore);
            evals.put(p.getId(), ev);

            if (ev.scored()) {
                Double ppg = pricePerGramProtein(p);
                if (ppg != null) {
                    ppgById.put(p.getId(), ppg);
                    pricesBySegment.computeIfAbsent(segment(p), k -> new ArrayList<>()).add(ppg);
                }
            }
        }

        Map<String, Double> medians = new HashMap<>();
        pricesBySegment.forEach((seg, list) -> { if (list.size() >= 5) medians.put(seg, median(list)); });

        for (Product p : protein) {
            Evaluation ev = evals.get(p.getId());
            String tag = tag(p);

            if (!ev.scored()) {
                if (p.getValueScore() != null) {
                    issues.add(String.format(Locale.ROOT,
                            "VALUE_SCORE_STALE — %s stored score %.1f but product is unscoreable (%s); run /api/admin/recalculate-scores",
                            tag, p.getValueScore(), ev.skipReason()));
                }
                if (ev.skipReason() == SkipReason.IMPLAUSIBLE_PROTEIN || ev.skipReason() == SkipReason.IMPLAUSIBLE_PRICE
                        || ev.skipReason() == SkipReason.CONFLICTING_WEIGHT) {
                    issues.add(String.format(Locale.ROOT,
                            "VALUE_SCORE_SKIPPED — %s %s (protein=%s%%, source=%s, price=%s %s, weight=%sg) — scraped data needs review",
                            tag, ev.skipReason(), p.getProteinPer100g(), p.getProteinSource(),
                            p.getNumericPrice(), p.getCurrency(), p.getPrimaryWeightGrams()));
                }
                continue;
            }

            double computed = ev.breakdown().total();
            if (p.getValueScore() == null || Math.abs(p.getValueScore() - computed) >= STORED_SCORE_TOLERANCE) {
                issues.add(String.format(Locale.ROOT,
                        "VALUE_SCORE_STALE — %s stored=%s computed=%.1f; run /api/admin/recalculate-scores",
                        tag, p.getValueScore() == null ? "null" : String.format(Locale.ROOT, "%.1f", p.getValueScore()), computed));
            }

            String src = ValueScoreCalculator.effectiveSource(p);
            if ("whey_concentrate".equals(src) && p.getProteinPer100g() != null && p.getProteinPer100g() >= 88) {
                issues.add(String.format(Locale.ROOT,
                        "PROTEIN_SOURCE_SUSPECT — %s labelled whey_concentrate but protein=%.1f%% (isolate-level)",
                        tag, p.getProteinPer100g()));
            }

            Double ppg = ppgById.get(p.getId());
            Double med = medians.get(segment(p));
            if (ppg != null && med != null) {
                double r = ppg / med;
                if (r < PRICE_OUTLIER_LOW || r > PRICE_OUTLIER_HIGH) {
                    issues.add(String.format(Locale.ROOT,
                            "PRICE_OUTLIER — %s %.4f %s/g protein is %.2fx the %s median (%.4f) — verify price and weight on the store page",
                            tag, ppg, cur(p), r, src, med));
                }
            }

            String weightIssue = ValueScoreCalculator.weightNameMismatch(p, WEIGHT_NAME_TOLERANCE);
            if (weightIssue != null) issues.add("WEIGHT_NAME_MISMATCH — " + tag + " " + weightIssue + " — price per gram and score use the latter");
        }

        issues.addAll(groupInconsistencies(protein));
        issues.addAll(brandIssues(protein, brandScoresLowercase));
        issues.addAll(benchmarkDrift(protein, ppgById));
        return issues;
    }

    // ------------------------------------------------------------------ groups

    private static List<String> groupInconsistencies(List<Product> products) {
        List<String> out = new ArrayList<>();
        Map<Long, List<Product>> groups = products.stream()
                .filter(p -> p.getGroupId() != null)
                .collect(Collectors.groupingBy(Product::getGroupId));
        groups.forEach((gid, ps) -> {
            if (ps.size() < 2) return;
            var proteins = ps.stream().map(Product::getProteinPer100g).filter(x -> x != null).toList();
            if (proteins.size() >= 2) {
                double min = proteins.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                double max = proteins.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                if (max - min > 3.0) {
                    out.add(String.format(Locale.ROOT,
                            "GROUP_INCONSISTENT — group %d '%s' has protein %.1f–%.1f%% across stores (ids %s); one store has a wrong value",
                            gid, ps.get(0).getName(), min, max,
                            ps.stream().map(p -> String.valueOf(p.getId())).collect(Collectors.joining(","))));
                }
            }
        });
        return out;
    }

    // ------------------------------------------------------------------ brands

    private static List<String> brandIssues(List<Product> products, Map<String, Double> brands) {
        List<String> out = new ArrayList<>();
        Map<String, Integer> unknown = new TreeMap<>();
        for (Product p : products) {
            String b = p.getBrand();
            if (b == null || b.isBlank()) continue;
            if (b.length() > 40 || b.contains("|")) {
                out.add(String.format("BRAND_SUSPECT — id=%s [%s] '%s' brand='%s' looks like scraped page text, not a brand",
                        p.getId(), p.getMarket(), p.getName(), b));
                continue;
            }
            if (!brands.containsKey(b.toLowerCase().trim())) unknown.merge(b, 1, Integer::sum);
        }
        unknown.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(e -> out.add(String.format(
                        "UNKNOWN_BRAND — '%s' (%d products) has no brand_reputation row and defaults to %.1f (-0.5..-0.9 score points); add it in a migration",
                        e.getKey(), e.getValue(), ValueScoreCalculator.DEFAULT_BRAND_SCORE)));
        return out;
    }

    // ------------------------------------------------------------------ benchmark drift

    private static List<String> benchmarkDrift(List<Product> products, Map<Long, Double> ppgById) {
        List<String> out = new ArrayList<>();
        Map<String, List<Double>> bySeg = new HashMap<>();
        Map<String, String[]> segMeta = new HashMap<>();
        for (Product p : products) {
            Double ppg = ppgById.get(p.getId());
            if (ppg == null || p.getProteinPer100g() == null || p.getProteinPer100g() < 60) continue;
            String src = ValueScoreCalculator.effectiveSource(p);
            if (src == null) continue;
            String seg = segment(p);
            bySeg.computeIfAbsent(seg, k -> new ArrayList<>()).add(ppg);
            segMeta.put(seg, new String[]{src, p.getCurrency()});
        }
        bySeg.forEach((seg, list) -> {
            if (list.size() < BENCHMARK_MIN_SAMPLE) return;
            String[] meta = segMeta.get(seg);
            double med = median(list);
            double bench = ValueScoreCalculator.benchmark(meta[0], meta[1]);
            double dev = bench / med - 1.0;
            if (Math.abs(dev) > BENCHMARK_DRIFT_TOLERANCE) {
                out.add(String.format(Locale.ROOT,
                        "BENCHMARK_DRIFT — %s benchmark %.3f is %+.0f%% vs current median %.3f (n=%d); recalibrate ValueScoreCalculator.benchmark",
                        seg, bench, dev * 100, med, list.size()));
            }
        });
        out.sort(Comparator.naturalOrder());
        return out;
    }

    // ------------------------------------------------------------------ helpers

    private static double brandScore(Product p, Map<String, Double> brands) {
        if (p.getBrand() == null || p.getBrand().isBlank()) return ValueScoreCalculator.DEFAULT_BRAND_SCORE;
        return brands.getOrDefault(p.getBrand().toLowerCase().trim(), ValueScoreCalculator.DEFAULT_BRAND_SCORE);
    }

    private static Double pricePerGramProtein(Product p) {
        double g = ValueScoreCalculator.extractPackageGrams(p);
        if (g <= 0 || p.getProteinPer100g() == null || p.getNumericPrice() == null || p.getNumericPrice() <= 0) return null;
        return p.getNumericPrice() / (p.getProteinPer100g() / 100.0 * g);
    }

    private static String segment(Product p) {
        String src = ValueScoreCalculator.effectiveSource(p);
        return (p.getMarket() == null ? "rs" : p.getMarket()) + "/" + (src == null ? "unknown" : src);
    }

    private static String cur(Product p) {
        return "EUR".equals(p.getCurrency()) ? "EUR" : "RSD";
    }

    private static String tag(Product p) {
        return String.format("id=%s [%s] '%s'", p.getId(), p.getMarket(), p.getName());
    }

    static double median(List<Double> values) {
        List<Double> s = values.stream().sorted().toList();
        int n = s.size();
        return n % 2 == 1 ? s.get(n / 2) : (s.get(n / 2 - 1) + s.get(n / 2)) / 2.0;
    }
}
