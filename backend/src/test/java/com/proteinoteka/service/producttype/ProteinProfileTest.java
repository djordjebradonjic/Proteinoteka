package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.BaseScraperEnricher;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Characterization of the protein rules that were moved out of ScraperService.saveOrUpdateProduct.
 * If one of these fails, protein scraping has changed behaviour — that was never the intent of the
 * multi-category refactor.
 */
class ProteinProfileTest {

    // BaseScraperEnricher only uses its AI service in the enrichment methods; the name filter is pure.
    private final ProteinProfile profile = new ProteinProfile(new BaseScraperEnricher(null));

    private static Product protein(String name, Double proteinPer100g) {
        Product p = new Product();
        p.setName(name);
        p.setProteinPer100g(proteinPer100g);
        return p;
    }

    @Test
    void nonProteinNamesAreRejectedExactlyLikeBefore() {
        assertTrue(profile.rejectReason(protein("Serious Mass 5.4kg", 15.0), false).isPresent());
        assertTrue(profile.rejectReason(protein("Creatine Caps 120 kapsula", null), false).isPresent());
        assertTrue(profile.rejectReason(protein("Whey + Creatine 2kg", null), false).isPresent());
        assertTrue(profile.rejectReason(protein("Gold Standard 100% Whey 2.27kg", 78.0), false).isEmpty());
    }

    @Test
    void lowProteinIsRejectedButUnknownProteinIsNot() {
        assertTrue(profile.rejectReason(protein("Mystery Blend 1kg", 24.9), false).isPresent());
        assertTrue(profile.rejectReason(protein("Mystery Blend 1kg", 25.0), false).isEmpty());
        assertTrue(profile.rejectReason(protein("Impact Whey 1kg", null), false).isEmpty());
    }

    @Test
    void sanitizeNullsOutOfRangeValues() {
        Product p = protein("Whey", 120.0);
        p.setSugarPer100g(101.0);
        p.setFatPer100g(100.0);
        p.setCaloriePer100g(901.0);
        profile.sanitize(p, "TestStore");
        assertNull(p.getProteinPer100g());
        assertNull(p.getSugarPer100g());
        assertEquals(100.0, p.getFatPer100g(), "100 is still allowed for fat");
        assertNull(p.getCaloriePer100g());

        Product low = protein("Whey", 14.0);
        profile.sanitize(low, "TestStore");
        assertNull(low.getProteinPer100g());
    }

    @Test
    void priceFloor() {
        assertEquals(1000.0, profile.minPrice("RSD"));
        assertEquals(5.0, profile.minPrice("EUR"));
    }

    @Test
    void missingProteinIsRestoredFromTheStoredRow() {
        Product stored = protein("Whey", 80.0);
        stored.setFatPer100g(3.0);
        stored.setSugarPer100g(2.0);
        stored.setCaloriePer100g(380.0);
        stored.setProteinSource("whey_isolate");
        stored.setPrimaryWeightGrams(2000.0);

        Product scraped = protein("Whey", null);
        assertTrue(profile.restoreFromStored(scraped, Optional.of(stored), "TestStore"));
        assertEquals(80.0, scraped.getProteinPer100g());
        assertEquals(3.0, scraped.getFatPer100g());
        assertEquals("whey_isolate", scraped.getProteinSource());
        assertEquals(2000.0, scraped.getPrimaryWeightGrams());
    }

    @Test
    void missingProteinWithNothingStoredMeansSkip() {
        assertFalse(profile.restoreFromStored(protein("Whey", null), Optional.empty(), "TestStore"));
        assertFalse(profile.restoreFromStored(protein("Whey", 10.0), Optional.of(protein("Whey", 10.0)), "TestStore"));
        assertTrue(profile.restoreFromStored(protein("Whey", 80.0), Optional.empty(), "TestStore"));
    }

    @Test
    void proteinIsOnlyUpdatedWhenItMovesByMoreThanThreeGrams() {
        Product existing = protein("Whey", 80.0);
        profile.mergeInto(existing, protein("Whey", 82.5));
        assertEquals(80.0, existing.getProteinPer100g());
        profile.mergeInto(existing, protein("Whey", 84.0));
        assertEquals(84.0, existing.getProteinPer100g());
        profile.mergeInto(existing, protein("Whey", 96.0));
        assertEquals(84.0, existing.getProteinPer100g(), "above 95 is never adopted");
    }

    @Test
    void suspiciousStoredCaloriesAreReplacedByAPlausibleScrape() {
        Product existing = protein("Whey", 80.0);
        existing.setCaloriePer100g(120.0);
        Product scraped = protein("Whey", 80.0);
        scraped.setCaloriePer100g(380.0);
        profile.mergeInto(existing, scraped);
        assertEquals(380.0, existing.getCaloriePer100g());
    }

    @Test
    void detailCompleteness() {
        Product p = protein("Whey", 80.0);
        p.setFatPer100g(3.0);
        assertFalse(profile.isDetailComplete(p, false), "sugar / calories / source still missing");
        assertTrue(profile.isDetailComplete(p, true), "nutrition in images: protein+fat is all a page can give");
        p.setSugarPer100g(2.0);
        p.setCaloriePer100g(380.0);
        p.setProteinSource("whey_isolate");
        assertTrue(profile.isDetailComplete(p, false));

        Product bar = protein("Protein Bar Box", 30.0);
        bar.setFatPer100g(10.0);
        assertTrue(profile.isDetailComplete(bar, false), "non-protein names never get a source, protein+fat is enough");

        assertFalse(profile.isDetailComplete(protein("Whey", null), true), "no protein at all is never complete");
    }
}
