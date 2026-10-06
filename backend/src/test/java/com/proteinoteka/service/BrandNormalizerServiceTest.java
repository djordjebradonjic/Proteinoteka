package com.proteinoteka.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void aSharedGenericWordDoesNotMakeTwoBrandsSimilar() {
        // "Mammut Nutrition" used to be renamed to "4+ Nutrition" through the shared word "Nutrition"
        assertTrue(BrandNormalizerService.similarity("Mammut Nutrition", "4+ Nutrition") < 80);
        assertTrue(BrandNormalizerService.similarity("Mammut Nutrition", "Ultimate Nutrition") < 80);
        assertTrue(BrandNormalizerService.similarity("Skill Nutrition", "Scitec Nutrition") < 80);
    }

    @Test
    void sameBrandStillMatchesWithOrWithoutTheGenericWord() {
        assertEquals(100, BrandNormalizerService.similarity("Scitec", "Scitec Nutrition"));
        assertTrue(BrandNormalizerService.similarity("Ultimate Nutrition", "ULTIMATE NUTRITION") >= 100);
        assertTrue(BrandNormalizerService.similarity("BioTechUSA", "BioTech USA") >= 80);
        assertTrue(BrandNormalizerService.similarity("Amix", "Amix Nutrition") >= 80);
        // a brand made only of generic words still compares as itself
        assertTrue(BrandNormalizerService.similarity("Sport Nutrition", "Sport Nutrition") >= 100);
        assertTrue(BrandNormalizerService.similarity("Muscle Labs", "Muscle Pharm") < 80);
        assertTrue(BrandNormalizerService.similarity("Muscle Labs", "MuscleTech") < 80);
    }
}
