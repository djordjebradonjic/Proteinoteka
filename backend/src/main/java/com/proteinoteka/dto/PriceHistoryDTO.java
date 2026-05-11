package com.proteinoteka.dto;

import java.time.LocalDateTime;

public record PriceHistoryDTO(String price,
                              Double numericPrice,
                              LocalDateTime timestamp) {
}
