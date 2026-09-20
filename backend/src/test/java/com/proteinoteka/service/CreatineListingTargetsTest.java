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

    // ---- HTML listings: protein first, then the store's creatine category read with its own parser

    private static void assertCreatineHtmlListing(Class<? extends StoreScraper> type, String url,
                                                  String firstPageUrl, String secondPageUrl, boolean trusted) {
        List<ListingTarget> targets = targetsOf(type);
        String store = type.getSimpleName();
        assertEquals(2, targets.size(), store);

        assertEquals("protein", targets.get(0).productType(), store + ": protein is always walked first");
        assertInstanceOf(ListingTarget.HtmlPaged.class, targets.get(0).source(), store);

        ListingTarget creatine = targets.get(1);
        assertEquals("creatine", creatine.productType(), store);
        ListingTarget.HtmlPaged source = assertInstanceOf(ListingTarget.HtmlPaged.class, creatine.source(), store);
        assertEquals(url, source.baseUrl(), store);
        assertEquals(firstPageUrl, source.pageUrl().apply(0), store);
        assertEquals(secondPageUrl, source.pageUrl().apply(1), store);
        assertEquals(trusted, creatine.categoryTrusted(), store);
    }

    @Test
    void fitLabWalksItsCreatineCategoryPageByPage() {
        String url = "https://fitlab.rs/sr/suplementi/kreatin";
        assertCreatineHtmlListing(FitLabScraper.class, url, url, url + "?page=2", true);
    }

    @Test
    void supplementStoreReadsTheWholeCreatineCategoryInOneRequest() {
        String url = "https://supplementstore.rs/kategorije/kreatin?limit=100";
        assertCreatineHtmlListing(SupplementStoreScraper.class, url, url, url + "&page=2", true);
    }

    @Test
    void ogistraReadsTheParentCreatineCategory() {
        String url = "https://www.ogistra-nutrition-shop.com/25-kreatini";
        assertCreatineHtmlListing(OgistraScraper.class, url, url, url + "?page=2", true);
    }

    @Test
    void xSportPagesAreOneBasedFromTheFirst() {
        String url = "https://www.xsport.rs/grupa/kreatin";
        assertCreatineHtmlListing(XSportScraper.class, url, url + "?page=1", url + "?page=2", true);
    }

    @Test
    void lamaAndProtekaHaveASinglePageCreatineCategory() {
        String lama = "https://www.lama.rs/kreatini";
        assertCreatineHtmlListing(LamaScraper.class, lama, lama, lama, true);
        String proteka = "https://www.proteka.hr/c/sportska-prehrana/kreatini";
        assertCreatineHtmlListing(ProtekaHrScraper.class, proteka, proteka, proteka, true);
    }

    @Test
    void proteiniSiHrWalksItsCreatineCategoryPageByPage() {
        String url = "https://www.proteini.si/hr/kreatin/";
        assertCreatineHtmlListing(ProteiniSiHrScraper.class, url, url, url + "?page=2", true);
    }

    // MyProtein files an electrolyte drink and a vitamin pack under creatine: an item must name creatine itself.
    @Test
    void myProteinCreatineCategoryIsNotTrusted() {
        String rs = "https://www.myprotein.rs/c/nutrition/creatine/";
        assertCreatineHtmlListing(MyProteinScraper.class, rs, rs, rs + "?pageNumber=2", false);
        String hr = "https://www.myprotein.hr/c/nutrition/creatine/";
        assertCreatineHtmlListing(MyProteinHrScraper.class, hr, hr, hr + "?pageNumber=2", false);
    }

    // Pansport is proxied too, and has no API: its creatine category is walked like the protein one
    // (0-based Drupal pager), the browser being needed for the size dropdowns.
    @Test
    void pansportWalksItsCreatineCategoryThroughTheProxiedBrowser() {
        String url = "https://www.pansport.rs/kreatin";
        assertCreatineHtmlListing(PansportScraper.class, url, url, url + "?page=1", true);
        assertTrue(mock(PansportScraper.class, CALLS_REAL_METHODS).requiresProxy());
    }

    // Proteinbox sits behind the paid IPRoyal proxy, so its creatine comes from the Store API (a few dozen
    // KB per run) rather than a browser walk.
    @Test
    void proteinboxReadsItsCreatineCategoryFromTheStoreApiThroughTheProxy() {
        assertProteinListingThenWooCreatine(targetsOf(ProteinboxScraper.class), "https://proteinbox.rs");
        assertTrue(mock(ProteinboxScraper.class, CALLS_REAL_METHODS).requiresProxy());
    }

    // Polleo Sport is broken and out of scope by decision; Shopbuilder sells only Scitec (no creatine
    // in its navigation) — neither gets a creatine target.
    @Test
    void outOfScopeStoresStayProteinOnly() {
        for (Class<? extends StoreScraper> type : List.of(PolleoSportScraper.class, ShopbuilderScraper.class)) {
            List<ListingTarget> targets = targetsOf(type);
            assertEquals(1, targets.size(), type.getSimpleName());
            assertEquals("protein", targets.get(0).productType(), type.getSimpleName());
        }
    }
}
