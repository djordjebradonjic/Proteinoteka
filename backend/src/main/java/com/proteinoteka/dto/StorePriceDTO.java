package com.proteinoteka.dto;

public record StorePriceDTO(
        Long id,
        String storeName,
        String price,
        Double numericPrice,
        String name,
        Double primaryWeightGrams,
        String proteinSource,
        String canonicalSlug
) {}
