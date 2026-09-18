package com.proteinoteka.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BrandNormalizerServiceTest {

    @Test
    void numberedListPrefixIsStrippedOnlyWhenFollowedByADot() {
        assertEquals("Scitec Nutrition", BrandNormalizerService.clean("96.Scitec Nutrition"));
        assertEquals("Scitec Nutrition", BrandNormalizerService.clean("96. Scitec Nutrition"));
    }

    @Test
    void brandsStartingWithADigitKeepIt() {
        // "5Star" / "5 Stars" used to become "Star" / "Stars" and lose the 5 Stars brand
        assertEquals("5Star", BrandNormalizerService.clean("5Star"));
        assertEquals("5 Stars", BrandNormalizerService.clean("5 Stars"));
        assertEquals("6PAK Nutrition", BrandNormalizerService.clean("6PAK Nutrition"));
    }

    @Test
    void trademarkSymbolsAreRemoved() {
        assertEquals("Amix", BrandNormalizerService.clean("Amix™"));
        assertEquals("Ultimate Nutrition", BrandNormalizerService.clean(" Ultimate Nutrition® "));
    }
}
