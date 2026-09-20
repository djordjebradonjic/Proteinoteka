package com.proteinoteka.service;


import com.proteinoteka.dto.DataQualityReport;
import com.proteinoteka.model.BrandReputation;
import com.proteinoteka.service.producttype.ProductTypes;
import com.proteinoteka.repository.BrandReputationRepository;
import com.proteinoteka.repository.DataQualityRepository;
import com.proteinoteka.repository.ProductGroupRepository;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataQualityService {

    private final DataQualityRepository repo;
    private final ProductRepository productRepository;
    private final BrandReputationRepository brandReputationRepository;
    private final ProductGroupRepository productGroupRepository;

    // Full store rotation is weekly (see ScrapingSchedulerService); a product untouched
    // for 2x that is a sign the scraper is silently failing for it specifically.
    private static final int STALE_DAYS = 14;

    public DataQualityReport generateReport(String market) {
        log.info("Generating Data Quality Report (market={})...", market == null ? "all" : market);

        int total = repo.countTotal(market);

        // Nutrition - protein
        int withoutProtein = repo.countWithoutProtein(market);
        int withProtein = total - withoutProtein;

        // Nutrition - new fields
        int withoutSugar = repo.countWithoutSugar(market);
        int withSugar = total - withoutSugar;

        int withoutFat = repo.countWithoutFat(market);
        int withFat = total - withoutFat;

        int withoutCalories = repo.countWithoutCalories(market);
        int withCalories = total - withoutCalories;

        int withoutProteinSource = repo.countWithoutProteinSource(market);
        int withProteinSource = total - withoutProteinSource;

        int withoutPrimaryWeight = repo.countWithoutPrimaryWeight(market);
        int withPrimaryWeight = total - withoutPrimaryWeight;

        // Value Score
        int withoutValueScore = repo.countWithoutValueScore(market);
        int withValueScore = total - withoutValueScore;

        // Images
        int withImage = repo.countWithImage(market);
        int withoutImage = total - withImage;

        // Prices
        int nullNumericPrice = repo.countNullNumericPrice(market);
        int zeroPrice = repo.countZeroNumericPrice(market);
        int highPrice = repo.countSuspiciouslyHighPrice(market);
        int validPrice = repo.countValidNumericPrice(market);
        int emptyPriceString = repo.countEmptyPriceString(market);

        // Other
        int withoutStore = repo.countWithoutStore(market);
        int duplicateGroups = repo.countDuplicateGroups(market);

        repo.findTopDuplicates(market).forEach(row ->
                log.warn("Duplicate: '{}' appears {} times", row[0], row[1])
        );

        List<String> warnings = buildWarnings(
                total, withoutProtein, withoutValueScore, withoutImage,
                zeroPrice, nullNumericPrice, highPrice, emptyPriceString,
                withoutStore, duplicateGroups, withoutSugar, withoutFat,
                withoutCalories, withoutProteinSource, withoutPrimaryWeight
        );

        String summary = String.format(
                "%d products | protein: %.1f%% | sugar: %.1f%% | fat: %.1f%% | calories: %.1f%% | source: %.1f%% | weight: %.1f%% | valueScore: %.1f%%",
                total,
                pct(withProtein, total),
                pct(withSugar, total),
                pct(withFat, total),
                pct(withCalories, total),
                pct(withProteinSource, total),
                pct(withPrimaryWeight, total),
                pct(withValueScore, total)
        );

        log.info("Report: {}", summary);
        warnings.forEach(w -> log.warn(w));

        return DataQualityReport.builder()
                .market(market == null ? "sve" : market)
                .totalProducts(total)
                .withProteinPer100g(withProtein)
                .withoutProteinPer100g(withoutProtein)
                .proteinCoveragePercent(pct(withProtein, total))
                .withSugarPer100g(withSugar)
                .withoutSugarPer100g(withoutSugar)
                .sugarCoveragePercent(pct(withSugar, total))
                .withFatPer100g(withFat)
                .withoutFatPer100g(withoutFat)
                .fatCoveragePercent(pct(withFat, total))
                .withCaloriePer100g(withCalories)
                .withoutCaloriePer100g(withoutCalories)
                .calorieCoveragePercent(pct(withCalories, total))
                .withProteinSource(withProteinSource)
                .withoutProteinSource(withoutProteinSource)
                .proteinSourceCoveragePercent(pct(withProteinSource, total))
                .withPrimaryWeightGrams(withPrimaryWeight)
                .withoutPrimaryWeightGrams(withoutPrimaryWeight)
                .primaryWeightCoveragePercent(pct(withPrimaryWeight, total))
                .withValueScore(withValueScore)
                .withoutValueScore(withoutValueScore)
                .valueScoreCoveragePercent(pct(withValueScore, total))
                .withImage(withImage)
                .withoutImage(withoutImage)
                .imageCoveragePercent(pct(withImage, total))
                .zeroPriceEntries(zeroPrice)
                .nullNumericPriceEntries(nullNumericPrice)
                .suspiciouslyHighPriceEntries(highPrice)
                .validPriceEntries(validPrice)
                .priceStringNullOrEmpty(emptyPriceString)
                .withoutStoreEntries(withoutStore)
                .duplicateGroups(duplicateGroups)
                .summary(summary)
                .warnings(warnings)
                .build();
    }

    private List<String> buildWarnings(int total, int withoutProtein, int withoutValueScore,
                                       int withoutImage, int zeroPrice, int nullNumericPrice,
                                       int highPrice, int emptyPriceString, int withoutStore,
                                       int duplicateGroups, int withoutSugar, int withoutFat,
                                       int withoutCalories, int withoutProteinSource,
                                       int withoutPrimaryWeight) {
        List<String> w = new ArrayList<>();

        if (pct(withoutProtein, total) > 20)
            w.add("⚠️ " + withoutProtein + " products missing proteinPer100g (" + pct(withoutProtein, total) + "%) - ValueScore will be inaccurate");

        if (pct(withoutValueScore, total) > 30)
            w.add("⚠️ " + withoutValueScore + " products missing ValueScore - sorting by value won't work");

        if (pct(withoutImage, total) > 25)
            w.add("🖼️ " + withoutImage + " products missing image (" + pct(withoutImage, total) + "%) - bad UX");

        if (zeroPrice > 0)
            w.add("🚨 " + zeroPrice + " products have numericPrice = 0 - must not be displayed!");

        if (nullNumericPrice > 0)
            w.add("🚨 " + nullNumericPrice + " products have numericPrice = NULL");

        if (emptyPriceString > 0)
            w.add("⚠️ " + emptyPriceString + " products have empty price string - scraper may have failed");

        if (highPrice > 0)
            w.add("🔍 " + highPrice + " products have price > 100,000 RSD - check manually");

        if (withoutStore > 0)
            w.add("🏪 " + withoutStore + " products have no store - orphan records");

        if (duplicateGroups > 5)
            w.add("🔁 " + duplicateGroups + " duplicate groups - same product on multiple stores without merge");

        if (pct(withoutPrimaryWeight, total) > 30)
            w.add("⚖️ " + withoutPrimaryWeight + " products missing primaryWeightGrams (" + pct(withoutPrimaryWeight, total) + "%) - ValueScore will be inaccurate");

        if (pct(withoutProteinSource, total) > 50)
            w.add("🏷️ " + withoutProteinSource + " products missing proteinSource (" + pct(withoutProteinSource, total) + "%) - filtering by type won't work");

        return w;
    }

    /**
     * Detects products with physically impossible or suspicious nutrition values.
     * Returns a list of human-readable issue strings and logs them as warnings.
     */
    // Read-only tx: the price-change audit walks each product's lazy priceHistories, and the
    // scheduler calls this outside any web request (no open-in-view session).
    @Transactional(readOnly = true)
    public List<String> checkOutliers(String market) {
        List<String> issues = new ArrayList<>();

        for (Object[] row : repo.findHighProteinOutliers(market)) {
            String msg = String.format("PROTEIN_TOO_HIGH — id=%s [%s] '%s' protein=%.1fg/100g (max realistic: 95g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findLowProteinOutliers(market)) {
            String msg = String.format("PROTEIN_TOO_LOW — id=%s [%s] '%s' protein=%.1fg/100g (min expected: 20g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findCalorieTooLowOutliers(market)) {
            String msg = String.format("CALORIE_IMPOSSIBLE — id=%s [%s] '%s' protein=%.1fg but calorie=%.1fkcal (min: protein×4 minus 5%% label rounding = %.0f)",
                    row[0], row[1], row[2],
                    ((Number) row[3]).doubleValue(),
                    ((Number) row[4]).doubleValue(),
                    ((Number) row[3]).doubleValue() * 4 * 0.95);
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findCalorieTooHighOutliers(market)) {
            String msg = String.format("CALORIE_TOO_HIGH — id=%s [%s] '%s' calorie=%.1fkcal/100g (max expected: 600)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findHighFatOutliers(market)) {
            String msg = String.format("FAT_TOO_HIGH — id=%s [%s] '%s' fat=%.1fg/100g (max expected: 50g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findHighSugarOutliers(market)) {
            String msg = String.format("SUGAR_TOO_HIGH — id=%s [%s] '%s' sugar=%.1fg/100g (max expected: 30g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findImplausiblyLowWeightOutliers(market)) {
            String msg = String.format("WEIGHT_IMPLAUSIBLE — id=%s [%s] '%s' primaryWeightGrams=%.2fg (likely a kg typo on the store site)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        LocalDateTime staleCutoff = LocalDateTime.now().minusDays(STALE_DAYS);
        for (Object[] row : repo.findStaleProducts(staleCutoff, market)) {
            String msg = String.format("STALE_PRODUCT — id=%s [%s] '%s' lastUpdated=%s (not refreshed in %d+ days)",
                    row[0], row[1], row[2], row[3], STALE_DAYS);
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        // The value-score and group audits know every family (each applies its own formula and rules);
        // the price-change audit belongs to the protein pages (/price-drops, Black Friday) it protects.
        List<com.proteinoteka.model.Product> allFamilies = loadProducts(market, false);
        issues.addAll(checkValueScoreIntegrity(allFamilies));
        issues.addAll(checkProductGroupIntegrity(allFamilies));
        issues.addAll(checkPriceChangeIntegrity(loadProducts(market, true)));

        if (issues.isEmpty()) {
            log.info("[DataQuality] Outlier check passed — no suspicious values found.");
        } else {
            log.warn("[DataQuality] Outlier check found {} issue(s). Review and fix manually or wait for next scrape.", issues.size());
        }

        return issues;
    }

    /**
     * @param proteinOnly the protein-specific checks (macros, protein source, price-drop pages) must not
     *                    see other families, which would show up there as "missing protein"; the value-score
     *                    and group audits take every family and split it themselves
     */
    private List<com.proteinoteka.model.Product> loadProducts(String market, boolean proteinOnly) {
        return productRepository.findAll().stream()
                .filter(p -> !proteinOnly || ProductTypes.PROTEIN.equals(p.getProductType()))
                .filter(p -> market == null || market.equalsIgnoreCase(p.getMarket()))
                .toList();
    }

    /**
     * Everything the value score depends on: stale/unscoreable scores, implausible protein or price,
     * cross-store inconsistency, weight vs name, unknown brands and benchmark drift.
     * See {@link ValueScoreAudit}.
     */
    public List<String> checkValueScoreIntegrity(String market) {
        return checkValueScoreIntegrity(loadProducts(market, false));
    }

    private List<String> checkValueScoreIntegrity(List<com.proteinoteka.model.Product> products) {
        Map<String, Double> brands = brandReputationRepository.findAll().stream()
                .collect(Collectors.toMap(b -> b.getBrandName().toLowerCase().trim(),
                        BrandReputation::getScore, (a, b) -> a));
        List<String> issues = ValueScoreAudit.run(products, brands);
        issues.forEach(i -> log.warn("[DataQuality] {}", i));
        return issues;
    }

    /**
     * Cross-store price-comparison groups: wrong members, mixed pack sizes/brands/protein types,
     * duplicate groups, ungrouped listings that belong in a group, wrong protein % inside a group.
     * See {@link ProductGroupAudit}.
     */
    private List<String> checkProductGroupIntegrity(List<com.proteinoteka.model.Product> products) {
        java.util.Set<String> markets = products.stream()
                .map(p -> p.getMarket() == null ? "rs" : p.getMarket()).collect(Collectors.toSet());
        List<com.proteinoteka.model.ProductGroup> groups = productGroupRepository.findAll().stream()
                .filter(g -> markets.contains(g.getMarket() == null ? "rs" : g.getMarket()))
                .toList();
        List<String> issues = ProductGroupAudit.run(groups, products);
        issues.forEach(i -> log.warn("[DataQuality] {}", i));
        return issues;
    }

    /**
     * Flapping/implausible price history and stale drop percentages behind the "biggest price
     * drop" sort, /price-drops and the newsletter digest. See {@link PriceChangeAudit}.
     */
    private List<String> checkPriceChangeIntegrity(List<com.proteinoteka.model.Product> products) {
        List<String> issues = PriceChangeAudit.run(products);
        issues.forEach(i -> log.warn("[DataQuality] {}", i));
        return issues;
    }

    private double pct(int part, int total) {
        if (total == 0) return 0;
        return Math.round(part * 1000.0 / total) / 10.0;
    }
}
