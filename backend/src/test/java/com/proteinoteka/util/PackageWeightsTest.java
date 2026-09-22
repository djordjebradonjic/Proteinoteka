package com.proteinoteka.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PackageWeightsTest {

    @Test
    void readsGramsAndKilograms() {
        assertEquals(500.0, PackageWeights.grams("Creatine 500g"));
        assertEquals(1000.0, PackageWeights.grams("1kg"));
        assertEquals(2270.0, PackageWeights.grams("Whey Gold Standard 2,27 kg"));
        assertEquals(150.0, PackageWeights.grams("Kreatin 150 gr"));
        assertEquals(400.0, PackageWeights.grams("400 g"));
    }

    @Test
    void aCommaAfterAWordIsPunctuationNotPartOfTheNumber() {
        // real Nutrition Shop HR titles: the weight follows the comma with no space
        assertEquals(250.0, PackageWeights.grams("OLIMP CREATINE MONOHYDRATE POWDER,250g"));
        assertEquals(300.0, PackageWeights.grams("DORIAN YATES CREATINE MONOHYDRATE,300g"));
        assertEquals(300.0, PackageWeights.grams("NUTREND CREATINE MONOHYDRATE, 300g"));
    }

    @Test
    void aNumberThatIsTheTailOfALongerOneIsStillNotAWeightOnItsOwn() {
        assertEquals(2270.0, PackageWeights.grams("2,27 kg"));
        assertEquals(1000.0, PackageWeights.grams("1.000 g"));
        assertNull(PackageWeights.grams("Vitamin 3,5mg"));
    }

    @Test
    void milligramsAndCountsAreNotPackWeights() {
        assertNull(PackageWeights.grams("Creatine 5000mg"));
        assertNull(PackageWeights.grams("200 kapsula"));
        assertNull(PackageWeights.grams("60 tableta za žvakanje"));
        assertNull(PackageWeights.grams(null));
    }

    @Test
    void implausibleWeightsAreRejected() {
        assertNull(PackageWeights.grams("0g"));
        assertNull(PackageWeights.grams("9999kg"));
    }

    @Test
    void labelsUseKilogramsOnlyForWholeKilos() {
        assertEquals("500g", PackageWeights.label(500));
        assertEquals("2kg", PackageWeights.label(2000));
        assertEquals("2270g", PackageWeights.label(2270));
    }
}
