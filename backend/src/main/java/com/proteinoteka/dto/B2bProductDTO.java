package com.proteinoteka.dto;

import java.time.LocalDateTime;
import java.util.List;

public record B2bProductDTO(
        Long id,
        String name,
        String brand,
        String storeName,
        String productUrl,
        String imageUrl,
        Double numericPrice,
        Double proteinPer100g,
        Double fatPer100g,
        Double sugarPer100g,
        Double caloriePer100g,
        String proteinSource,
        Double primaryWeightGrams,
        Double valueScore,
        Integer percentileRank,
        List<String> flavours,
        List<String> weights,
        String canonicalSlug,
        LocalDateTime lastUpdated
) {}
