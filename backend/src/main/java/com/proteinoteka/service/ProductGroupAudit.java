package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.ProductGroup;
import com.proteinoteka.util.ProductLineMatcher;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Read-only audit of product groups (cross-store price-comparison groups). Pure — no Spring/DB —
 * so it is unit-testable; DataQualityService feeds it the catalogue.
 *
 * <p>It reuses {@link ProductGroupService#fitsGroup} and {@link ProductGroupService#groupingSource}
 * so the audit and the auto-assignment can never disagree about what "belongs together" means.
 */
public final class ProductGroupAudit {

    private ProductGroupAudit() {}

    /** A member this far from the group's median protein is almost certainly a wrong scrape. */
    static final double PROTEIN_OUTLIER_GRAMS = 8.0;
    /** With only two members there is no median: a gap this big means one of them is wrong. */
    static final double PROTEIN_PAIR_GAP_GRAMS = 10.0;
    static final double STALE_WEIGHT_TOLERANCE = 0.02;
    /** Groups this close in pack size may be one product split by weight noise; wider is a different pack. */
    static final double DUPLICATE_WEIGHT_WINDOW = 0.10;
    /** Different lines of the same brand/weight differ in protein (Pea&Rice vs Vegan Pro isolate). */
    static final double DUPLICATE_PROTEIN_WINDOW = 6.0;

    public static List<String> run(List<ProductGroup> groups, List<Product> products) {
        List<String> issues = new ArrayList<>();
        Map<Long, List<Product>> byGroup = products.stream()
                .filter(p -> p.getGroupId() != null)
                .collect(Collectors.groupingBy(Product::getGroupId));

        for (ProductGroup g : groups) {
            List<Product> members = byGroup.getOrDefault(g.getId(), List.of());
            String tag = String.format("group %d '%s'", g.getId(), g.getCanonicalName());
            groupChecks(g, members, tag, issues);
        }

        issues.addAll(duplicateGroups(groups, byGroup));
        issues.addAll(ungroupedThatFit(groups, byGroup, products));
        return issues;
    }

    // ------------------------------------------------------------------ per-group

    private static void groupChecks(ProductGroup g, List<Product> members, String tag, List<String> out) {
        if (members.size() < 2) {
            out.add(String.format("GROUP_TOO_SMALL — %s has %d listing(s); nothing to compare (POST /api/admin/groups/refresh dissolves it)",
                    tag, members.size()));
            return;
        }

        Map<String, Long> perStore = members.stream()
                .filter(p -> p.getStore() != null)
                .collect(Collectors.groupingBy(p -> p.getStore().getName(), Collectors.counting()));
        perStore.forEach((store, n) -> {
            if (n > 1) out.add(String.format("GROUP_SAME_STORE — %s has %d listings from %s", tag, n, store));
        });

        if (members.stream().map(p -> p.getMarket() == null ? "rs" : p.getMarket()).distinct().count() > 1) {
            out.add(String.format("GROUP_MIXED_MARKET — %s mixes markets", tag));
        }

        List<String> brands = members.stream().map(p -> p.getBrand() == null ? "" : p.getBrand().trim().toLowerCase())
                .distinct().toList();
        if (brands.size() > 1) {
            out.add(String.format("GROUP_MIXED_BRAND — %s members have brands %s (ids %s)", tag,
                    members.stream().map(Product::getBrand).distinct().toList(), ids(members)));
        }

        List<String> sources = members.stream().map(ProductGroupService::groupingSource).distinct().toList();
        if (sources.size() > 1) {
            out.add(String.format("GROUP_MIXED_SOURCE — %s mixes protein types %s (ids %s)", tag, sources, ids(members)));
        }

        // Pack size: grams, or pieces for a group of capsules/tablets/gummies (see ProductGroupService.sizeOf)
        List<Double> weights = members.stream().map(ProductGroupService::sizeOf)
                .filter(Objects::nonNull).toList();
        if (!weights.isEmpty()) {
            String unit = unitOf(members);
            double min = weights.stream().mapToDouble(Double::doubleValue).min().orElse(0);
            double max = weights.stream().mapToDouble(Double::doubleValue).max().orElse(0);
            if (max / min > 1 + ProductGroupService.sizeTolerance(members.get(0))) {
                out.add(String.format(Locale.ROOT,
                        "GROUP_WEIGHT_SPREAD — %s spans %.0f–%.0f %s (%.0f%%); different pack sizes are not comparable (ids %s)",
                        tag, min, max, unit, (max / min - 1) * 100, ids(members)));
            }
            double avg = ProductGroupService.averageSize(members);
            if (g.getWeightGrams() == null || Math.abs(g.getWeightGrams() - avg) / avg > STALE_WEIGHT_TOLERANCE) {
                out.add(String.format(Locale.ROOT,
                        "GROUP_STALE_METADATA — %s stored size %s %s but members average %.0f %s (POST /api/admin/groups/refresh)",
                        tag, g.getWeightGrams() == null ? "null" : String.format(Locale.ROOT, "%.0f", g.getWeightGrams()),
                        unit, avg, unit));
            }
        }

        // Only a real conflict counts: the member has distinguishing words, so do others, and they
        // share none. A member with no distinguishing words ("Iso Whey Zero 908g") or only a flavour
        // name says nothing about the product line, so it is not evidence either way.
        for (Product p : members) {
            if (ProductLineMatcher.productLineWords(p.getName(), p.getBrand()).isEmpty()) continue;
            List<Product> comparable = members.stream()
                    .filter(o -> o != p && !ProductLineMatcher.productLineWords(o.getName(), o.getBrand()).isEmpty())
                    .toList();
            if (comparable.isEmpty()) continue;
            boolean related = comparable.stream().anyMatch(o ->
                    ProductLineMatcher.sameProductLine(p.getName(), p.getBrand(), o.getName(), o.getBrand()));
            if (!related) {
                out.add(String.format("GROUP_NAME_MISMATCH — %s: id=%s '%s' shares no product line with the other members",
                        tag, p.getId(), p.getName()));
            }
        }

        proteinChecks(members, tag, out);
    }

    private static void proteinChecks(List<Product> members, String tag, List<String> out) {
        List<Product> withProtein = members.stream().filter(p -> p.getProteinPer100g() != null).toList();
        if (withProtein.size() < 2) return;
        if (withProtein.size() == 2) {
            double a = withProtein.get(0).getProteinPer100g(), b = withProtein.get(1).getProteinPer100g();
            if (Math.abs(a - b) >= PROTEIN_PAIR_GAP_GRAMS) {
                out.add(String.format(Locale.ROOT,
                        "GROUP_PROTEIN_OUTLIER — %s: ids %s have protein %.1f%% vs %.1f%% — one is wrong",
                        tag, ids(withProtein), a, b));
            }
            return;
        }
        double med = ValueScoreAudit.median(withProtein.stream().map(Product::getProteinPer100g).toList());
        for (Product p : withProtein) {
            if (Math.abs(p.getProteinPer100g() - med) >= PROTEIN_OUTLIER_GRAMS) {
                out.add(String.format(Locale.ROOT,
                        "GROUP_PROTEIN_OUTLIER — %s: id=%s [%s] protein %.1f%% vs group median %.1f%% (likely correct value: %.1f%%)",
                        tag, p.getId(), p.getStore() == null ? "?" : p.getStore().getName(), p.getProteinPer100g(), med, med));
            }
        }
    }

    // ------------------------------------------------------------------ across groups

    /** Two groups for the same product (weight noise or a late-created group) should be one. */
    private static List<String> duplicateGroups(List<ProductGroup> groups, Map<Long, List<Product>> byGroup) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < groups.size(); i++) {
            for (int j = i + 1; j < groups.size(); j++) {
                ProductGroup a = groups.get(i), b = groups.get(j);
                List<Product> ma = byGroup.getOrDefault(a.getId(), List.of());
                List<Product> mb = byGroup.getOrDefault(b.getId(), List.of());
                if (ma.isEmpty() || mb.isEmpty()) continue;
                if (a.getBrand() == null || b.getBrand() == null || !a.getBrand().equalsIgnoreCase(b.getBrand())) continue;
                if (!String.valueOf(a.getMarket()).equalsIgnoreCase(String.valueOf(b.getMarket()))) continue;
                // grams and pieces are different units: a capsule group is never a duplicate of a powder one
                if (ProductGroupService.isPieceSized(ma.get(0)) != ProductGroupService.isPieceSized(mb.get(0))) continue;
                double wa = ProductGroupService.averageSize(ma), wb = ProductGroupService.averageSize(mb);
                if (wa <= 0 || wb <= 0 || Math.abs(wa - wb) / Math.min(wa, wb) > DUPLICATE_WEIGHT_WINDOW) continue;
                if (!ProductGroupService.groupingSource(ma.get(0)).equals(ProductGroupService.groupingSource(mb.get(0)))) continue;
                if (proteinsDiffer(ma, mb)) continue;
                // A single shared generic word ("isolate") must not make "Iso Cool" and "Iso Sensation"
                // look identical: at least half of each group's members must match the other group.
                if (matchShare(ma, mb) < 0.5 || matchShare(mb, ma) < 0.5) continue;
                out.add(String.format(Locale.ROOT,
                        "DUPLICATE_GROUPS — groups %d '%s' (%.0f %s) and %d '%s' (%.0f %s) may be the same product (same brand, pack size and line) — review, then merge if so",
                        a.getId(), a.getCanonicalName(), wa, unitOf(ma), b.getId(), b.getCanonicalName(), wb, unitOf(mb)));
            }
        }
        return out;
    }

    private static double matchShare(List<Product> from, List<Product> to) {
        long hits = from.stream().filter(x -> to.stream().anyMatch(y ->
                ProductLineMatcher.sameProductLine(x.getName(), x.getBrand(), y.getName(), y.getBrand()))).count();
        return (double) hits / from.size();
    }

    private static boolean proteinsDiffer(List<Product> a, List<Product> b) {
        List<Double> pa = a.stream().map(Product::getProteinPer100g).filter(x -> x != null).toList();
        List<Double> pb = b.stream().map(Product::getProteinPer100g).filter(x -> x != null).toList();
        if (pa.isEmpty() || pb.isEmpty()) return false;
        return Math.abs(ValueScoreAudit.median(pa) - ValueScoreAudit.median(pb)) > DUPLICATE_PROTEIN_WINDOW;
    }

    /** Ungrouped listings that the auto-assignment rule says belong in an existing group. */
    private static List<String> ungroupedThatFit(List<ProductGroup> groups, Map<Long, List<Product>> byGroup,
                                                 List<Product> products) {
        List<String> out = new ArrayList<>();
        Map<Long, ProductGroup> byId = new HashMap<>();
        groups.forEach(g -> byId.put(g.getId(), g));
        for (Product p : products) {
            if (p.getGroupId() != null) continue;
            if (p.getBrand() == null || ProductGroupService.sizeOf(p) == null) continue;
            List<ProductGroup> fits = groups.stream()
                    .filter(g -> ProductGroupService.fitsGroup(p, g, byGroup.getOrDefault(g.getId(), List.of())))
                    .toList();
            if (fits.size() == 1) {
                out.add(String.format("UNGROUPED_MATCH — id=%s [%s] '%s' fits group %d '%s' (POST /api/admin/groups/auto-generate attaches it)",
                        p.getId(), p.getMarket(), p.getName(), fits.get(0).getId(), fits.get(0).getCanonicalName()));
            } else if (fits.size() > 1) {
                out.add(String.format("UNGROUPED_AMBIGUOUS — id=%s [%s] '%s' fits several groups %s — they may be duplicates of each other — review and merge",
                        p.getId(), p.getMarket(), p.getName(),
                        fits.stream().map(g -> String.valueOf(g.getId())).collect(Collectors.joining(","))));
            }
        }
        return out;
    }

    /** "pcs" for a group of capsules/tablets/gummies, "g" otherwise. */
    private static String unitOf(List<Product> members) {
        return ProductGroupService.isPieceSized(members.get(0)) ? "pcs" : "g";
    }

    private static String ids(List<Product> ps) {
        return ps.stream().map(p -> String.valueOf(p.getId())).collect(Collectors.joining(","));
    }
}
