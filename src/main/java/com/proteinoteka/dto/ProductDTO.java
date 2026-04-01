package com.proteinoteka.dto;

import java.util.List;

public record ProductDTO(String name,
                         String brand,
                         String price,
                         String imageUrl,
                         String productUrl,
                         String storeName,
                         List<String> weights,
                         List<String> flavours) {
}
