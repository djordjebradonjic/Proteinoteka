package com.proteinoteka.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ProductDTO(Long id,
                         String name,
                         String brand,
                         String price,
                         String imageUrl,
                         String productUrl,
                         String storeName,
                         List<String> weights,
                         List<String> flavours,
                         List<PriceHistoryDTO> priceHistory,
                         String  description,
                         Double numericPrice,
                         Double proteinPer100g,
                         Double valueScore,
                         Double primaryWeightGrams,
                         Double sugarPer100g,
                         Double fatPer100g,
                         Double caloriePer100g,
                         String proteinSource,
                         String aiDescription,
                         Double previousPrice,
                         Integer percentileRank,
                         LocalDateTime lastUpdated,
                         String canonicalSlug,
                         String market,
                         String currency)
    {
}
