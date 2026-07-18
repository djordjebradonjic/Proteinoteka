package com.proteinoteka.dto;

public record NewsletterCampaignRequest(
        String market,
        Integer sentCount
) {}
