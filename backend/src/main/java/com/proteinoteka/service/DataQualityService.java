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
        log.info("Pokretanje Data Quality izveštaja...");

        int total = (int) repo.count();

        // Nutrition
        int withoutProtein = repo.countWithoutProtein();
        int withProtein = total - withoutProtein;

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

        // Ostalo
        int withoutStore = repo.countWithoutStore();
        int duplicateGroups = repo.countDuplicateGroups();

        // Debug log — top duplikati
        repo.findTopDuplicates().forEach(row ->
                log.warn("Duplikat: '{}' pojavljuje se {} puta", row[0], row[1])
        );

        List<String> warnings = buildWarnings(
                total, withoutProtein, withoutValueScore, withoutImage,
                zeroPrice, nullNumericPrice, highPrice, emptyPriceString,
                withoutStore, duplicateGroups
        );

        String summary = String.format(
                "%d proizvoda | protein: %.1f%% | slika: %.1f%% | valueScore: %.1f%% | duplikati: %d | nulte cene: %d",
                total,
                pct(withProtein, total),
                pct(withImage, total),
                pct(withValueScore, total),
                duplicateGroups,
                zeroPrice
        );

        log.info("Izveštaj: {}", summary);
        warnings.forEach(w -> log.warn(w));

        return DataQualityReport.builder()
                .totalProducts(total)
                .withProteinPer100g(withProtein)
                .withoutProteinPer100g(withoutProtein)
                .proteinCoveragePercent(pct(withProtein, total))
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
                                       int duplicateGroups) {
        List<String> w = new ArrayList<>();

        if (pct(withoutProtein, total) > 20)
            w.add("⚠️ " + withoutProtein + " proizvoda nema proteinPer100g (" + pct(withoutProtein, total) + "%) — ValueScore neće biti tačan");

        if (pct(withoutValueScore, total) > 30)
            w.add("⚠️ " + withoutValueScore + " proizvoda nema ValueScore — sortiranje po vrednosti neće raditi");

        if (pct(withoutImage, total) > 25)
            w.add("🖼️ " + withoutImage + " proizvoda nema sliku (" + pct(withoutImage, total) + "%) — loš UX");

        if (zeroPrice > 0)
            w.add("🚨 " + zeroPrice + " proizvoda ima numericPrice = 0 — ne smeju biti prikazani!");

        if (nullNumericPrice > 0)
            w.add("🚨 " + nullNumericPrice + " proizvoda ima numericPrice = NULL");

        if (emptyPriceString > 0)
            w.add("⚠️ " + emptyPriceString + " proizvoda ima prazan price string — scraper možda nije parsovao");

        if (highPrice > 0)
            w.add("🔍 " + highPrice + " proizvoda ima cenu > 100.000 RSD — proveri ručno");

        if (withoutStore > 0)
            w.add("🏪 " + withoutStore + " proizvoda nema prodavnicu — orphan records");

        if (duplicateGroups > 5)
            w.add("🔁 " + duplicateGroups + " grupa duplikata — isti proizvod na više prodavnica bez merge-a");

        return w;
    }

    private double pct(int part, int total) {
        if (total == 0) return 0;
        return Math.round(part * 1000.0 / total) / 10.0;
    }
}
