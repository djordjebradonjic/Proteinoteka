package com.proteinoteka.dto;

import java.time.LocalDateTime;

public record NewsletterCampaignDTO(
        String market,
        int sentCount,
        LocalDateTime sentAt
) {}
