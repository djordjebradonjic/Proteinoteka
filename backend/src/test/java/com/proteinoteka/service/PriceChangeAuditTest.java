package com.proteinoteka.service;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PriceChangeAuditTest {

    private static long nextId = 1;

    private static Product product(String name, String slug, double price) {
        Product p = new Product();
        p.setId(nextId++);
        p.setName(name);
        p.setBrand("GymBeam");
        p.setCanonicalSlug(slug);
        p.setNumericPrice(price);
        p.setMarket("rs");
        return p;
    }

    private static Product withHistory(Product p, double price, String ts) {
        PriceHistory h = new PriceHistory();
        h.setId(nextId++);
        h.setNumericPrice(price);
        h.setTimestamp(LocalDateTime.parse(ts));
        h.setProduct(p);
        p.getPriceHistories().add(h);
        return p;
    }

    private static boolean has(List<String> issues, String code) {
        return issues.stream().anyMatch(i -> i.startsWith(code));
    }

    @Test
    void cleanProductHasNoFindings() {
        Product p = withHistory(product("Vegan Blend", "vegan-blend-gymbeam-1kg", 3390.0), 4390.0, "2026-06-24T11:07:00");
        p.setLastPriceDropPct(1000.0 / 4390.0);
        assertEquals(List.of(), PriceChangeAudit.run(List.of(p)));
    }

    @Test
    void productWithoutHistoryHasNoFindings() {
        assertEquals(List.of(), PriceChangeAudit.run(List.of(product("Vegan Blend", "vegan-blend-gymbeam-1kg", 3390.0))));
    }

    @Test
    void implausibleMoveIsReportedTogetherWithTheStaleStoredDrop() {
        Product p = withHistory(product("Mutant Mass", "mutant-mass-pvl-2270g", 3490.0), 7190.0, "2026-08-22T14:28:00");
        p.setLastPriceDropPct((7190.0 - 3490.0) / 7190.0);
        List<String> issues = PriceChangeAudit.run(List.of(p));
        assertTrue(has(issues, "PRICE_CHANGE_IMPLAUSIBLE"), issues.toString());
        assertTrue(has(issues, "PRICE_CHANGE_STALE"), issues.toString());
    }

    @Test
    void flappingHistoryIsReported() {
        Product p = product("Pure Whey Pro", "pure-whey-pro-1kg", 3500.0);
        withHistory(p, 3290.0, "2026-08-05T11:27:00");
        withHistory(p, 4990.0, "2026-08-05T11:28:00");
        assertTrue(has(PriceChangeAudit.run(List.of(p)), "PRICE_HISTORY_FLAPPING"));
    }

    @Test
    void staleStoredDropIsReportedEvenWhenHistoryIsFine() {
        Product p = withHistory(product("Vegan Blend", "vegan-blend-gymbeam-1kg", 3390.0), 4390.0, "2026-06-24T11:07:00");
        p.setLastPriceDropPct(0.9);
        List<String> issues = PriceChangeAudit.run(List.of(p));
        assertTrue(has(issues, "PRICE_CHANGE_STALE"));
        assertFalse(has(issues, "PRICE_CHANGE_IMPLAUSIBLE"));
    }

    @Test
    void rowWhoseNameNoLongerMatchesItsSlugIsIdentityDrift() {
        // GymBeam RS id 562: "Protein Soy Isolate" carrying the slug it got as "True Whey".
        Product p = withHistory(product("Protein Soy Isolate - GymBeam", "true-whey-gymbeam-1kg", 1600.0), 1500.0, "2026-07-25T15:12:00");
        p.setLastPriceDropPct(null);
        p.setLastPriceIncreasePct(100.0 / 1500.0);
        assertTrue(has(PriceChangeAudit.run(List.of(p)), "IDENTITY_DRIFT"));
    }

    @Test
    void matchingNameAndSlugIsNotDrift() {
        Product p = withHistory(product("Protein Soy Isolate - GymBeam", "protein-soy-isolate-gymbeam-1kg", 1600.0), 1500.0, "2026-07-25T15:12:00");
        p.setLastPriceIncreasePct(100.0 / 1500.0);
        assertFalse(has(PriceChangeAudit.run(List.of(p)), "IDENTITY_DRIFT"));
    }

    @Test
    void diacriticsInTheNameDoNotCauseDrift() {
        // Slugs are ASCII-folded at creation ("govedi"), names keep their diacritics ("goveđi").
        Product p = withHistory(product("100 % goveđi protein - Nutrend", "100-govedi-protein-nutrend-900g", 5000.0), 4800.0, "2026-07-25T15:12:00");
        p.setBrand("Nutrend");
        p.setLastPriceIncreasePct(200.0 / 4800.0);
        assertFalse(has(PriceChangeAudit.run(List.of(p)), "IDENTITY_DRIFT"));
    }
}
