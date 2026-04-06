package com.proteinoteka.dto;

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
                         String  description)
    {
}
