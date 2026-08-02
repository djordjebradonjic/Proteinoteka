package com.proteinoteka.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DataQualityReport {
    private String market;
    private int totalProducts;

    // Nutrition - protein
    private int withProteinPer100g;
    private int withoutProteinPer100g;
    private double proteinCoveragePercent;

    // Nutrition - new fields
    private int withSugarPer100g;
    private int withoutSugarPer100g;
    private double sugarCoveragePercent;

    private int withFatPer100g;
    private int withoutFatPer100g;
    private double fatCoveragePercent;

    private int withCaloriePer100g;
    private int withoutCaloriePer100g;
    private double calorieCoveragePercent;

    private int withProteinSource;
    private int withoutProteinSource;
    private double proteinSourceCoveragePercent;

    private int withPrimaryWeightGrams;
    private int withoutPrimaryWeightGrams;
    private double primaryWeightCoveragePercent;

    // Value Score
    private int withValueScore;
    private int withoutValueScore;
    private double valueScoreCoveragePercent;

    // Images
    private int withImage;
    private int withoutImage;
    private double imageCoveragePercent;

    // Prices
    private int zeroPriceEntries;
    private int nullNumericPriceEntries;
    private int suspiciouslyHighPriceEntries;
    private int validPriceEntries;
    private int priceStringNullOrEmpty;

    // Other
    private int withoutStoreEntries;
    private int duplicateGroups;

    // Summary
    private String summary;
    private List<String> warnings;
}