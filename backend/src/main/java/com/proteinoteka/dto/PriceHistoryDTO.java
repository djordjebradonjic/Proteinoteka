package com.proteinoteka.dto;

import java.time.LocalDateTime;

public record PriceHistoryDTO(String price,
                              LocalDateTime timestamp) {
}
