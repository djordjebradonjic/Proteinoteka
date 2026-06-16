package com.proteinoteka.dto;

import java.time.LocalDateTime;

public record ReviewDTO(
        Long id,
        String displayName,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {}
