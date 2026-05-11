package com.proteinoteka.dto;

public record CalculatorSubscribeRequest(
        String email,
        String name,
        String goal,
        Integer protein,
        Integer calories,
        Integer carbs,
        Integer fat
) {}
