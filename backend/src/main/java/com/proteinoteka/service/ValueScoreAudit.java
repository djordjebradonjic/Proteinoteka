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
        List<Product> creatine = products.stream()
                .filter(p -> "creatine".equals(p.getProductType()))
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

        issues.addAll(brandIssues(products, brandScoresLowercase));
        issues.addAll(benchmarkDrift(protein, ppgById));
        issues.addAll(creatineIssues(creatine, brandScoresLowercase));
        return issues;
    }

    // ------------------------------------------------------------------ creatine

    /**
     * The same questions as for protein, asked of the creatine formula (price per gram of pack): stale
     * stored scores, prices outside any believable range, listings far from their market's median, and a
     * benchmark that no longer matches the market. Creatine sold by the piece is reported once as a data
     * gap — it cannot be scored without servings x dose, and that is not an error of any one listing.
     */
    private static List<String> creatineIssues(List<Product> creatine, Map<String, Double> brands) {
        List<String> out = new ArrayList<>();
        if (creatine.isEmpty()) return out;

        Map<Long, Evaluation> evals = new HashMap<>();
        Map<Long, Double> ppgById = new HashMap<>();
        Map<String, List<Double>> pricesByMarket = new HashMap<>();
        Map<String, String> currencyByMarket = new HashMap<>();
        int counted = 0;

        for (Product p : creatine) {
            Evaluation ev = ValueScoreCalculator.evaluate(p.getNumericPrice(), p, brandScore(p, brands));
            evals.put(p.getId(), ev);
            if (ev.skipReason() == SkipReason.COUNTED_FORM) counted++;
            if (ev.scored()) {
                double ppg = p.getNumericPrice() / ValueScoreCalculator.extractPackageGrams(p);
                ppgById.put(p.getId(), ppg);
                String market = market(p);
                pricesByMarket.computeIfAbsent(market, k -> new ArrayList<>()).add(ppg);
                currencyByMarket.put(market, cur(p));
            }
        }

        Map<String, Double> medians = new HashMap<>();
        pricesByMarket.forEach((market, list) -> { if (list.size() >= 5) medians.put(market, median(list)); });

        for (Product p : creatine) {
            Evaluation ev = evals.get(p.getId());
            String tag = tag(p);

            if (!ev.scored()) {
                if (p.getValueScore() != null) {
                    out.add(String.format(Locale.ROOT,
                            "VALUE_SCORE_STALE — %s stored score %.1f but the creatine is unscoreable (%s); run /api/admin/recalculate-scores",
                            tag, p.getValueScore(), ev.skipReason()));
                }
                if (ev.skipReason() == SkipReason.IMPLAUSIBLE_PRICE) {
                    double g = ValueScoreCalculator.extractPackageGrams(p);
                    out.add(String.format(Locale.ROOT,
                            "VALUE_SCORE_SKIPPED — %s IMPLAUSIBLE_PRICE (price=%s %s, weight=%.0fg = %.4f %s/g of pack against the %.4f market benchmark) — a wrong price or weight, or not (only) creatine",
                            tag, p.getNumericPrice(), p.getCurrency(), g, p.getNumericPrice() / g, cur(p),
                            ValueScoreCalculator.creatineBenchmark(p.getCurrency())));
                }
                continue;
            }

            double computed = ev.breakdown().total();
            if (p.getValueScore() == null || Math.abs(p.getValueScore() - computed) >= STORED_SCORE_TOLERANCE) {
                out.add(String.format(Locale.ROOT,
                        "VALUE_SCORE_STALE — %s stored=%s computed=%.1f; run /api/admin/recalculate-scores",
                        tag, p.getValueScore() == null ? "null" : String.format(Locale.ROOT, "%.1f", p.getValueScore()), computed));
            }

            Double ppg = ppgById.get(p.getId());
            Double med = medians.get(market(p));
            if (ppg != null && med != null) {
                double r = ppg / med;
                if (r < PRICE_OUTLIER_LOW || r > PRICE_OUTLIER_HIGH) {
                    out.add(String.format(Locale.ROOT,
                            "PRICE_OUTLIER — %s %.4f %s/g of pack is %.2fx the %s creatine median (%.4f) — verify price and weight on the store page",
                            tag, ppg, cur(p), r, market(p), med));
                }
            }
        }

        pricesByMarket.forEach((market, list) -> {
            if (list.size() < BENCHMARK_MIN_SAMPLE) return;
            double med = median(list);
            double bench = ValueScoreCalculator.creatineBenchmark(currencyByMarket.get(market));
            double dev = bench / med - 1.0;
            if (Math.abs(dev) > BENCHMARK_DRIFT_TOLERANCE) {
                out.add(String.format(Locale.ROOT,
                        "BENCHMARK_DRIFT — %s/creatine benchmark %.3f is %+.0f%% vs current median %.3f (n=%d); recalibrate ValueScoreCalculator.CREATINE_BENCHMARK_*",
                        market, bench, dev * 100, med, list.size()));
            }
        });

        if (counted > 0) {
            out.add(String.format(Locale.ROOT,
                    "CREATINE_UNSCORED_COUNTED_FORMS — %d capsule/tablet/gummy listings carry no value score: their price per gram of creatine needs servings x dose, which stores rarely state (a data gap, not an error of any one listing)",
                    counted));
        }
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

    private static String market(Product p) {
        return p.getMarket() == null ? "rs" : p.getMarket();
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
