package com.proteinoteka.dto;

import java.util.UUID;

public record NewsletterActiveSubscriberDTO(
        String email,
        UUID unsubscribeToken
) {}
