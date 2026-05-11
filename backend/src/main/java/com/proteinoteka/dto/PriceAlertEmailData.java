package com.proteinoteka.dto;

import java.util.UUID;

public record PriceAlertEmailData(
        Long jobId,
        String email,
        Long productId,
        String productName,
        String productImageUrl,
        double oldPrice,
        double newPrice,
        double percentageDrop,
        boolean is30dLow,
        UUID unsubscribeToken
) {}
