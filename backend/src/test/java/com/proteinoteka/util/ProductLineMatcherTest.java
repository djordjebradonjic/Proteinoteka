package com.proteinoteka.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ProductLineMatcherTest {

    private static boolean same(String a, String b, String brand) {
        return ProductLineMatcher.sameProductLine(a, brand, b, brand);
    }

    @Test
    void compoundSpellingsOfTheSameLineMatch() {
        // XSport writes "IsoSensation"/"IsoCool"; other stores write "Iso Sensation"/"Iso Cool"
        assertTrue(same("Ultimate Nutrition IsoSensation 93 (2.3 kg)", "Iso Sensation 93 2.27kg - Ultimate Nutrition", "Ultimate Nutrition"));
        assertTrue(same("Ultimate Nutrition IsoCool 2,3kg", "Ultimate Nutrition Iso Cool", "Ultimate Nutrition"));
    }

    @Test
    void distinctLinesOfTheSameBrandDoNotMatch() {
        assertFalse(same("Iso Cool 908g", "Iso Sensation 93 910g", "Ultimate Nutrition"));
        assertFalse(same("Ultimate Nutrition IsoCool", "Iso Sensation 93", "Ultimate Nutrition"));
        assertFalse(same("Anabolic Masster 2.2kg", "Anabolic Monster Whey 2kg", "Amix Nutrition"));
    }

    @Test
    void serbianAndEnglishSpellingsOfDistinguishingWordsMatch() {
        assertTrue(same("Izolat whey protein 750g - Maximalium", "Isolate Whey Protein – Maximalium", "Maximalium"));
        assertTrue(same("Kazein protein (Micelarni) 2000g", "Casein Micellar 2kg", "The Nutrition"));
        assertTrue(same("SCITEC 100% Whey Profesional 500g", "100% Whey Protein Professional", "Scitec Nutrition"));
        assertTrue(same("THE X3M Veggie protein", "X3M Vegan Protein - 1000g THE", "The Nutrition"));
    }

    @Test
    void listingNoiseIsIgnored() {
        assertTrue(same("Iso zero100 2kg + gratis ŠEJKER", "Iso zero100 2kg", "Tesla Nutrition"));
        assertTrue(same("Whey Pure FUSION 1000 grama", "Whey Pure Fusion", "Amix Nutrition"));
    }

    @Test
    void unitMustEndAtAWordBoundary() {
        // "100 gold" used to lose its "g" and leave "old"
        assertTrue(ProductLineMatcher.productLineWords("Zebra 100 gold", null).contains("zebra"));
        assertTrue(ProductLineMatcher.productLineWords("Whey Pure Fusion 1000 grama", "Amix").isEmpty());
    }

    @Test
    void oneSideGenericAndOtherSpecificIsNotAMatch() {
        // "Whey Protein" reduces to a fully generic name; "Protein boba" has a distinguishing word
        assertTrue(ProductLineMatcher.productLineWords("Whey Protein", "X").isEmpty());
        assertFalse(same("Protein boba", "Whey Protein", "GymBeam"));
        assertTrue(same("Whey Protein", "100% Whey Protein", "GymBeam"));
    }

    @Test
    void wordOverlapContractIsUnchanged() {
        assertTrue(ProductLineMatcher.hasWordOverlap(java.util.Set.of(), java.util.Set.of()));
        assertFalse(ProductLineMatcher.hasWordOverlap(java.util.Set.of("boba"), java.util.Set.of()));
        assertTrue(ProductLineMatcher.hasWordOverlap(java.util.Set.of("cool", "x"), java.util.Set.of("cool")));
    }
}
