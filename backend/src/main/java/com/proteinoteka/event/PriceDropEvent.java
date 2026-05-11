package com.proteinoteka.event;

/**
 * Published by ScraperService when a product's price drops significantly.
 * All data needed to create alert jobs is carried in the event itself,
 * so listeners don't need to re-query the product mid-transaction.
 */
public record PriceDropEvent(
        Long productId,
        String productName,
        String productImageUrl,
        double oldPrice,
        double newPrice,
        double percentageDrop
) {}
