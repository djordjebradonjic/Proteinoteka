package com.proteinoteka.service;

import org.springframework.stereotype.Component;

@Component
public class GymBeamScraper extends AbstractGymBeamScraper {

    private static final String STORE_NAME = "GymBeam";
    private static final String BASE_URL = "https://gymbeam.rs/proteini";

    public GymBeamScraper(NutritionParserService nutritionParser,
                          BaseScraperEnricher baseEnricher,
                          ProxyAwareHttpClient httpClient) {
        super(nutritionParser, baseEnricher, httpClient);
    }

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl()   { return BASE_URL; }

    @Override
    protected String formatPrice(double price) {
        return String.valueOf(Math.round(price));
    }
}
