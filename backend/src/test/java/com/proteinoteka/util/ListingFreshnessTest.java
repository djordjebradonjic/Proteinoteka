package com.proteinoteka.util;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ListingFreshnessTest {

    private static final LocalDateTime NOW = LocalDateTime.parse("2026-09-30T12:00:00");

    // ── listingCutoff ────────────────────────────────────────────────────────────

    @Test
    void listingCutoffIsTwoWeeklyCycles() {
        assertEquals(LocalDateTime.parse("2026-09-16T12:00:00"), ListingFreshness.listingCutoff(NOW));
    }

    // ── isConfirmedForDeals ──────────────────────────────────────────────────────

    @Test
    void dealConfirmedWhenLastScrapeSawTheProduct() {
        // GymBeam scraped 2026-09-26, product found (missed_scrapes = 0).
        assertTrue(ListingFreshness.isConfirmedForDeals(product("2026-09-26T15:12:00", 0), NOW));
    }

    @Test
    void dealRejectedWhenStoreScrapesFail() {
        // Polleo Sport: blocked by Cloudflare, rows last refreshed 2026-08-02, missed_scrapes still 0.
        assertFalse(ListingFreshness.isConfirmedForDeals(product("2026-08-02T07:55:00", 0), NOW));
    }

    @Test
    void dealRejectedWhenLatestScrapeDidNotFindTheProduct() {
        // Refreshed recently enough, but the store's latest run no longer listed it (sold out/delisted).
        assertFalse(ListingFreshness.isConfirmedForDeals(product("2026-09-26T15:12:00", 1), NOW));
    }

    @Test
    void dealConfirmationAllowsOneWeeklyCyclePlusADay() {
        assertTrue(ListingFreshness.isConfirmedForDeals(product("2026-09-22T12:00:00", 0), NOW));
        assertFalse(ListingFreshness.isConfirmedForDeals(product("2026-09-22T11:59:00", 0), NOW));
    }

    @Test
    void dealRejectedWithoutLastUpdated() {
        assertFalse(ListingFreshness.isConfirmedForDeals(product(null, 0), NOW));
    }

    // ── isRecentPriceChange ──────────────────────────────────────────────────────

    @Test
    void recentDropCountsByNewestHistoryRow() {
        // Clear Whey: 3320 replaced on 2026-09-26 → drop is 4 days old; the July row doesn't matter.
        assertTrue(ListingFreshness.isRecentPriceChange(
                List.of(history("2026-07-01T10:00:00"), history("2026-09-26T15:10:00")), NOW));
    }

    @Test
    void dropWindowIsOneWeek() {
        assertTrue(ListingFreshness.isRecentPriceChange(List.of(history("2026-09-23T12:00:00")), NOW));
        // Vegan Blend: 2850 replaced on 2026-09-19 — the sale had already ended when checked on 09-30.
        assertFalse(ListingFreshness.isRecentPriceChange(List.of(history("2026-09-19T15:10:00")), NOW));
    }

    @Test
    void oldDropIsNoLongerNews() {
        // FueSix: 4390 replaced on 2026-06-24 and still listed as a "biggest drop" in September.
        assertFalse(ListingFreshness.isRecentPriceChange(List.of(history("2026-06-24T12:56:00")), NOW));
    }

    @Test
    void noHistoryMeansNoRecentChange() {
        assertFalse(ListingFreshness.isRecentPriceChange(List.of(), NOW));
        assertFalse(ListingFreshness.isRecentPriceChange(null, NOW));
    }

    // ── pageKey ──────────────────────────────────────────────────────────────────

    @Test
    void packSizesOfOnePageShareAKey() {
        // Quattro Pro 900g and 1800g took two of the eight drop cards.
        assertEquals(
                ListingFreshness.pageKey("https://gymbeam.rs/protein-quatro-pro-1800-g-megabol.html?pakovanje=900g"),
                ListingFreshness.pageKey("https://gymbeam.rs/protein-quatro-pro-1800-g-megabol.html?pakovanje=1800g"));
    }

    @Test
    void pageKeyKeepsDifferentPagesApart() {
        assertEquals("https://example.rs/a.html", ListingFreshness.pageKey("https://example.rs/a.html#reviews"));
        assertFalse(ListingFreshness.pageKey("https://example.rs/a.html")
                .equals(ListingFreshness.pageKey("https://example.rs/b.html")));
    }

    private static Product product(String lastUpdated, int missedScrapes) {
        Product p = new Product();
        p.setLastUpdated(lastUpdated == null ? null : LocalDateTime.parse(lastUpdated));
        p.setMissedScrapes(missedScrapes);
        return p;
    }

    private static PriceHistory history(String ts) {
        PriceHistory h = new PriceHistory();
        h.setNumericPrice(1000.0);
        h.setTimestamp(LocalDateTime.parse(ts));
        return h;
    }
}
