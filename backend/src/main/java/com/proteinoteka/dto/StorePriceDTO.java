package com.proteinoteka.dto;

public record StorePriceDTO(
        Long id,
        String storeName,
        String price,
        Double numericPrice
) {}
