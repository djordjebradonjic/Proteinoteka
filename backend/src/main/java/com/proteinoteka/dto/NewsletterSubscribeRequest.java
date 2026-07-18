package com.proteinoteka.dto;

public record NewsletterSubscribeRequest(
        String email,
        String market,
        String source
) {}
