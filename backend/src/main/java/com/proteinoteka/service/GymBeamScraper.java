package com.proteinoteka.service;

import com.proteinoteka.service.producttype.ProductTypes;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GymBeamScraper extends AbstractGymBeamScraper {

    private static final String STORE_NAME = "GymBeam";
    private static final String BASE_URL = "https://gymbeam.rs/proteini";
    private static final String CREATINE_URL = "https://gymbeam.rs/kreatin";

    public GymBeamScraper(NutritionParserService nutritionParser,
                          BaseScraperEnricher baseEnricher,
                          ProxyAwareHttpClient httpClient) {
        super(nutritionParser, baseEnricher, httpClient);
    }

    @Override public String getStoreName() { return STORE_NAME; }
    @Override public String getBaseUrl()   { return BASE_URL; }

    @Override
    public List<ListingTarget> listingTargets() {
        return List.of(
                ListingTarget.html(ProductTypes.PROTEIN, BASE_URL, this::buildPageUrl),
                ListingTarget.html(ProductTypes.CREATINE, CREATINE_URL, page -> pageUrl(CREATINE_URL, page)));
    }

    @Override
    protected String formatPrice(double price) {
        return String.valueOf(Math.round(price));
    }
}
