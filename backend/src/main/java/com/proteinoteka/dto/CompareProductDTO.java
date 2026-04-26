package com.proteinoteka.dto;

public record CompareProductDTO(
        Long id,
        String name,
        String brand,
        String price,
        String imageUrl,
        String storeName,
        String productUrl,
        Double numericPrice,
        Double valueScore,
        Double proteinPer100g,
        Double sugarPer100g,
        Double fatPer100g,
        Double caloriePer100g,
        String proteinSource,
        Double primaryWeightGrams,
        Double pricePerKg,       // derived: numericPrice / weightKg
        Double pricePerProtein   // derived: numericPrice / totalProteinGrams
) {}
