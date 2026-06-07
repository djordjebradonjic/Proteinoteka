package com.proteinoteka.service;


import com.proteinoteka.dto.DataQualityReport;
import com.proteinoteka.repository.DataQualityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataQualityService {

    private final DataQualityRepository repo;

    public DataQualityReport generateReport() {
        log.info("Generating Data Quality Report...");

        int total = (int) repo.count();

        // Nutrition - protein
        int withoutProtein = repo.countWithoutProtein();
        int withProtein = total - withoutProtein;

        // Nutrition - new fields
        int withoutSugar = repo.countWithoutSugar();
        int withSugar = total - withoutSugar;

        int withoutFat = repo.countWithoutFat();
        int withFat = total - withoutFat;

        int withoutCalories = repo.countWithoutCalories();
        int withCalories = total - withoutCalories;

        int withoutProteinSource = repo.countWithoutProteinSource();
        int withProteinSource = total - withoutProteinSource;

        int withoutPrimaryWeight = repo.countWithoutPrimaryWeight();
        int withPrimaryWeight = total - withoutPrimaryWeight;

        // Value Score
        int withoutValueScore = repo.countWithoutValueScore();
        int withValueScore = total - withoutValueScore;

        // Images
        int withImage = repo.countWithImage();
        int withoutImage = total - withImage;

        // Prices
        int nullNumericPrice = repo.countNullNumericPrice();
        int zeroPrice = repo.countZeroNumericPrice();
        int highPrice = repo.countSuspiciouslyHighPrice();
        int validPrice = repo.countValidNumericPrice();
        int emptyPriceString = repo.countEmptyPriceString();

        // Other
        int withoutStore = repo.countWithoutStore();
        int duplicateGroups = repo.countDuplicateGroups();

        repo.findTopDuplicates().forEach(row ->
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
    public List<String> checkOutliers() {
        List<String> issues = new ArrayList<>();

        for (Object[] row : repo.findHighProteinOutliers()) {
            String msg = String.format("PROTEIN_TOO_HIGH — id=%s [%s] '%s' protein=%.1fg/100g (max realistic: 95g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findLowProteinOutliers()) {
            String msg = String.format("PROTEIN_TOO_LOW — id=%s [%s] '%s' protein=%.1fg/100g (min expected: 20g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findCalorieTooLowOutliers()) {
            String msg = String.format("CALORIE_IMPOSSIBLE — id=%s [%s] '%s' protein=%.1fg but calorie=%.1fkcal (min: protein×4=%.0f)",
                    row[0], row[1], row[2],
                    ((Number) row[3]).doubleValue(),
                    ((Number) row[4]).doubleValue(),
                    ((Number) row[3]).doubleValue() * 4);
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findCalorieTooHighOutliers()) {
            String msg = String.format("CALORIE_TOO_HIGH — id=%s [%s] '%s' calorie=%.1fkcal/100g (max expected: 600)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findHighFatOutliers()) {
            String msg = String.format("FAT_TOO_HIGH — id=%s [%s] '%s' fat=%.1fg/100g (max expected: 50g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        for (Object[] row : repo.findHighSugarOutliers()) {
            String msg = String.format("SUGAR_TOO_HIGH — id=%s [%s] '%s' sugar=%.1fg/100g (max expected: 30g)",
                    row[0], row[1], row[2], ((Number) row[3]).doubleValue());
            issues.add(msg);
            log.warn("[DataQuality] {}", msg);
        }

        if (issues.isEmpty()) {
            log.info("[DataQuality] Outlier check passed — no suspicious values found.");
        } else {
            log.warn("[DataQuality] Outlier check found {} issue(s). Review and fix manually or wait for next scrape.", issues.size());
        }

        return issues;
    }

    private double pct(int part, int total) {
        if (total == 0) return 0;
        return Math.round(part * 1000.0 / total) / 10.0;
    }
}
