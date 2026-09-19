package com.proteinoteka.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mock;

/**
 * Which stores scrape creatine, and from where. The targets are pure configuration (constants of the
 * scraper class), so the scrapers are created without their collaborators.
 */
class CreatineListingTargetsTest {

    private static List<ListingTarget> targetsOf(Class<? extends StoreScraper> type) {
        return mock(type, CALLS_REAL_METHODS).listingTargets();
    }

    private static void assertProteinListingThenWooCreatine(List<ListingTarget> targets, String origin) {
        assertEquals(2, targets.size());

        assertEquals("protein", targets.get(0).productType(), "protein is always walked first");
        assertInstanceOf(ListingTarget.HtmlPaged.class, targets.get(0).source());

        ListingTarget creatine = targets.get(1);
        assertEquals("creatine", creatine.productType());
        assertEquals(new ListingTarget.WooStoreApi(origin, "kreatin"), creatine.source());
        assertTrue(creatine.categoryTrusted());
    }

    @Test
    void proteiniSiReadsItsCreatineCategoryFromTheStoreApi() {
        assertProteinListingThenWooCreatine(targetsOf(ProteiniSiScraper.class), "https://proteinisi.rs");
    }

    @Test
    void supplementShopReadsItsCreatineCategoryFromTheStoreApi() {
        assertProteinListingThenWooCreatine(targetsOf(SupplementShopScraper.class), "https://supplementshop.rs");
    }

    @Test
    void proteiniOutletHrReadsItsCreatineCategoryFromTheStoreApi() {
        assertProteinListingThenWooCreatine(targetsOf(ProteiniOutletHrScraper.class), "https://www.proteini-outlet.com");
    }

    @Test
    void nutritionShopHrReadsItsCreatineCategoryFromTheStoreApi() {
        assertProteinListingThenWooCreatine(targetsOf(NutritionShopHrScraper.class), "https://nutrition-shop.hr");
    }

    // Proteinbox and Pansport go through the paid IPRoyal proxy. Their creatine is wired only after the
    // Store API transport has been tried from the production host, so until then they stay protein-only.
    @Test
    void proxiedStoresAreNotWiredYet() {
        for (Class<? extends StoreScraper> type : List.of(ProteinboxScraper.class, PansportScraper.class)) {
            List<ListingTarget> targets = targetsOf(type);
            assertEquals(1, targets.size(), type.getSimpleName());
            assertEquals("protein", targets.get(0).productType(), type.getSimpleName());
        }
    }
}
