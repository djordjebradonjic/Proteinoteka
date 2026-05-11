package com.proteinoteka.dto;

public record TargetPriceRequest(
        String email,
        Long productId,
        Double targetPrice  // null = no threshold, alert on any significant drop
) {}
