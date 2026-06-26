package com.proteinoteka.service;

import org.springframework.stereotype.Component;

@Component
public class GymBeamHrScraper extends AbstractGymBeamScraper {

    private static final String STORE_NAME = "GymBeam HR";
    private static final String BASE_URL = "https://gymbeam.hr/proteini";

    public GymBeamHrScraper(NutritionParserService nutritionParser,
                             BaseScraperEnricher baseEnricher,
                             ProxyAwareHttpClient httpClient) {
        super(nutritionParser, baseEnricher, httpClient);
    }

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl()   { return BASE_URL; }
    @Override public String getMarket()    { return "hr"; }
    @Override public String getCurrency()  { return "EUR"; }

    @Override
    protected String formatPrice(double price) {
        return String.format("%.2f", price);
    }
}
