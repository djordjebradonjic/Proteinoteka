package com.proteinoteka.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ProductNameCleanerTest {

    // ── Examples from the task ────────────────────────────────────────────────

    @Test
    void stripKategorijaSuffixWithNemaStanju() {
        // Cleaner strips suffix only — original capitalization is preserved
        assertEquals(
            "Milky whey shake 700g - 6PAK",
            ProductNameCleaner.clean("Milky whey shake 700g - 6PAK Kategorija 2.490 RSD Nema na stanju")
        );
    }

    @Test
    void stripKategorijaSuffixWithDodajUKorpu() {
        assertEquals(
            "Whey protein 1kg - Vitalikum",
            ProductNameCleaner.clean("Whey protein 1kg - Vitalikum Kategorija 2.990 RSD Dodaj u korpu")
        );
    }

    @Test
    void stripLeadingDiscountAndKategorija() {
        assertEquals(
            "Whey Pro protein 700g - Nutriversum",
            ProductNameCleaner.clean("-15% Whey Pro protein 700g - Nutriversum Kategorija 2.850 RSD2.430 RSD Dodaj u korpu")
        );
    }

    @Test
    void noDiscount_stripKategorija_100percentIsProductName() {
        // "100%" is 3 digits — not treated as a discount prefix, stays in name
        assertEquals(
            "100% Whey PREMIUM 908gr - Azgard",
            ProductNameCleaner.clean("100% Whey PREMIUM 908gr - Azgard Kategorija 3.190 RSD Nema na stanju")
        );
    }

    @Test
    void stripKategorijaNemaStanju_OstroVit() {
        assertEquals(
            "Whey Protein 700g - OstroVit",
            ProductNameCleaner.clean("Whey Protein 700g - OstroVit Kategorija 2.650 RSD Nema na stanju")
        );
    }

    // ── Edge cases ────────────────────────────────────────────────────────────

    @Test
    void alreadyCleanNameIsUnchanged() {
        assertEquals(
            "Whey Protein 1kg - Optimum Nutrition",
            ProductNameCleaner.clean("Whey Protein 1kg - Optimum Nutrition")
        );
    }

    @Test
    void nullReturnsNull() {
        assertNull(ProductNameCleaner.clean(null));
    }

    @Test
    void blankStringReturnsBlank() {
        assertEquals("   ", ProductNameCleaner.clean("   "));
    }

    @Test
    void positiveLeadingDiscount() {
        assertEquals(
            "Whey Isolate 2kg - Scitec",
            ProductNameCleaner.clean("20% Whey Isolate 2kg - Scitec Kategorija 5.990 RSD Dodaj u korpu")
        );
    }

    @Test
    void kategorijaCaseInsensitive() {
        assertEquals(
            "Test Product 500g - Brand",
            ProductNameCleaner.clean("Test Product 500g - Brand KATEGORIJA 1.000 RSD Na stanju")
        );
    }

    @Test
    void naStanjuActionText() {
        assertEquals(
            "Gold Standard 908g - ON",
            ProductNameCleaner.clean("Gold Standard 908g - ON Kategorija 4.200 RSD Na stanju")
        );
    }

    @Test
    void trailingDashAfterStrip() {
        // If "Kategorija..." were the only thing after a dash, the dash itself should go too
        assertEquals(
            "Casein Protein 900g",
            ProductNameCleaner.clean("Casein Protein 900g - Kategorija 3.500 RSD Nema na stanju")
        );
    }

    @Test
    void priceWithCommaDecimal() {
        assertEquals(
            "ISO Whey 1kg - MyProtein",
            ProductNameCleaner.clean("ISO Whey 1kg - MyProtein Kategorija 3.490,00 RSD Dodaj u korpu")
        );
    }
}
