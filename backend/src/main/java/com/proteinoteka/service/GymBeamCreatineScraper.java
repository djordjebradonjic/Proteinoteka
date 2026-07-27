package com.proteinoteka.service;

import org.springframework.stereotype.Component;

// Pilot creatine scraper: covers GymBeam's separate /kreatin collection page. Registered
// under a distinct store name ("GymBeam Kreatin") so the weekly scheduler/ScrapeLog can
// dispatch it independently from GymBeamScraper, but products attach to the SAME "GymBeam"
// store row (see getStoreRowName()) since it's the same physical retailer, just a different
// product family.
@Component
public class GymBeamCreatineScraper extends AbstractGymBeamScraper {

    private static final String STORE_NAME = "GymBeam Kreatin";
    private static final String STORE_ROW_NAME = "GymBeam";
    private static final String BASE_URL = "https://gymbeam.rs/kreatin";

    public GymBeamCreatineScraper(NutritionParserService nutritionParser,
                                   BaseScraperEnricher baseEnricher,
                                   ProxyAwareHttpClient httpClient) {
        super(nutritionParser, baseEnricher, httpClient);
    }

    @Override public String getStoreName()    { return STORE_NAME; }
    @Override public String getStoreRowName() { return STORE_ROW_NAME; }
    @Override public String getBaseUrl()      { return BASE_URL; }
    @Override protected boolean isCreatineMode() { return true; }
    @Override public String getProductType() { return "creatine"; }

    @Override
    protected String formatPrice(double price) {
        return String.valueOf(Math.round(price));
    }
}
