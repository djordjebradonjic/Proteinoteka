package com.proteinoteka.dto;

public record ReviewSubmitRequest(
        String displayName,
        String email,
        Integer rating,
        String comment
) {}
