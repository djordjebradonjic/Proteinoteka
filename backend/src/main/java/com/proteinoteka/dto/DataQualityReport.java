package com.proteinoteka.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

    @Data
    @Builder
    public class DataQualityReport {
        private int totalProducts;

        // Nutrition
        private int withProteinPer100g;
        private int withoutProteinPer100g;
        private double proteinCoveragePercent;

        // Value Score
        private int withValueScore;
        private int withoutValueScore;
        private double valueScoreCoveragePercent;

        // Images
        private int withImage;
        private int withoutImage;
        private double imageCoveragePercent;

        // Prices (numericPrice field)
        private int zeroPriceEntries;
        private int suspiciouslyHighPriceEntries;
        private int validPriceEntries;
        private int nullNumericPriceEntries;

        // Price/String mismatch
        private int priceStringNullOrEmpty;

        // Duplicates
        private int duplicateGroups;

        // Stores
        private int withoutStoreEntries;

        // Summary
        private String summary;
        private List<String> warnings;
    }

