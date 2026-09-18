package com.proteinoteka.util;

import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PriceIntegrityTest {

    // ── isSafeRepoint ────────────────────────────────────────────────────────────

    @Test
    void repointRejectedWhenDifferentProductWithSameWeightHasFarPrice() {
        // Lama: "100% Whey Isolate" 2kg (7.400) vs "Shadowhey Isolate" 2000g (10.900) — a 47% gap.
        assertFalse(PriceIntegrity.isSafeRepoint(7400.0, 10900.0));
        assertFalse(PriceIntegrity.isSafeRepoint(10900.0, 7400.0));
    }

    @Test
    void repointAllowedWhenPriceIsEssentiallyUnchanged() {
        assertTrue(PriceIntegrity.isSafeRepoint(4990.0, 4990.0));
        assertTrue(PriceIntegrity.isSafeRepoint(4990.0, 5400.0));   // +8.2%
        assertTrue(PriceIntegrity.isSafeRepoint(5000.0, 4500.0));   // exactly -10%
    }

    @Test
    void repointBoundaryIsExclusiveOfTenPercent() {
        assertFalse(PriceIntegrity.isSafeRepoint(5000.0, 5501.0));  // +10.02%
    }

    @Test
    void repointAllowedWhenThereIsNothingToCompare() {
        // No usable old price → no price change can be recorded, so nothing can be poisoned.
        assertTrue(PriceIntegrity.isSafeRepoint(null, 3500.0));
        assertTrue(PriceIntegrity.isSafeRepoint(0.0, 3500.0));
        assertTrue(PriceIntegrity.isSafeRepoint(3500.0, null));
    }

    // ── keepLowestPricePerUrl ────────────────────────────────────────────────────

    private static Product item(String url, String price) {
        Product p = new Product();
        p.setUrl(url);
        p.setPrice(price);
        return p;
    }

    private static Double parse(Product p) {
        return p.getPrice() == null ? null : Double.valueOf(p.getPrice());
    }

    @Test
    void duplicateUrlKeepsLowestPrice() {
        // MyProtein "Proteinska Mešavina Total" 1kg: same URL emitted at 4.200 and 3.250.
        Product high = item("https://x/p?pakovanje=1kg", "4200");
        Product low = item("https://x/p?pakovanje=1kg", "3250");
        List<Product> out = PriceIntegrity.keepLowestPricePerUrl(List.of(high, low), PriceIntegrityTest::parse);
        assertEquals(1, out.size());
        assertSame(low, out.get(0));
    }

    @Test
    void duplicateUrlKeepsLowestRegardlessOfOrder() {
        Product low = item("https://x/p", "3250");
        Product high = item("https://x/p", "4200");
        List<Product> out = PriceIntegrity.keepLowestPricePerUrl(List.of(low, high), PriceIntegrityTest::parse);
        assertEquals(1, out.size());
        assertSame(low, out.get(0));
    }

    @Test
    void distinctUrlsAndOrderArePreserved() {
        Product a = item("https://x/a", "100");
        Product b = item("https://x/b", "200");
        Product noUrl1 = item(null, "300");
        Product noUrl2 = item(" ", "300");
        List<Product> out = PriceIntegrity.keepLowestPricePerUrl(List.of(a, noUrl1, b, noUrl2), PriceIntegrityTest::parse);
        assertEquals(List.of(a, noUrl1, b, noUrl2), out);
    }

    @Test
    void duplicateWithInvalidPriceNeverReplacesValidOne() {
        Product valid = item("https://x/p", "3250");
        Product missing = item("https://x/p", null);
        Product zero = item("https://x/p", "0");
        List<Product> out = PriceIntegrity.keepLowestPricePerUrl(List.of(valid, missing, zero), PriceIntegrityTest::parse);
        assertEquals(1, out.size());
        assertSame(valid, out.get(0));
    }

    @Test
    void validPriceReplacesInvalidFirstOccurrence() {
        Product missing = item("https://x/p", null);
        Product valid = item("https://x/p", "3250");
        List<Product> out = PriceIntegrity.keepLowestPricePerUrl(List.of(missing, valid), PriceIntegrityTest::parse);
        assertEquals(1, out.size());
        assertSame(valid, out.get(0));
    }

    // ── hasUnstablePriceHistory ──────────────────────────────────────────────────

    @Test
    void flappingHistoryFromProductionIsUnstable() {
        // Lama 1417: two rows in the same week-run (08-13: 7.400 and 10.900), repeating weekly.
        assertTrue(PriceIntegrity.hasUnstablePriceHistory(List.of(
                LocalDateTime.parse("2026-08-13T04:02:11.100"),
                LocalDateTime.parse("2026-08-13T04:02:40.900"),
                LocalDateTime.parse("2026-08-06T04:01:58.000"),
                LocalDateTime.parse("2026-08-06T04:02:30.000"))));
    }

    @Test
    void genuineWeeklyRepricingIsStable() {
        // Ogistra 348 / GymBeam-style: one change per weekly run.
        assertFalse(PriceIntegrity.hasUnstablePriceHistory(List.of(
                LocalDateTime.parse("2026-09-05T13:07:56"),
                LocalDateTime.parse("2026-08-22T13:07:56"),
                LocalDateTime.parse("2026-07-04T13:07:56"))));
    }

    @Test
    void emptySingleAndNullTimestampsAreStable() {
        assertFalse(PriceIntegrity.hasUnstablePriceHistory(List.of()));
        assertFalse(PriceIntegrity.hasUnstablePriceHistory(List.of(LocalDateTime.parse("2026-09-05T13:07:56"))));
        assertFalse(PriceIntegrity.hasUnstablePriceHistory(java.util.Arrays.asList(null, LocalDateTime.parse("2026-09-05T13:07:56"))));
    }

    @Test
    void windowIsOneHour() {
        LocalDateTime t = LocalDateTime.parse("2026-09-05T13:00:00");
        assertTrue(PriceIntegrity.hasUnstablePriceHistory(List.of(t, t.plusMinutes(59))));
        assertFalse(PriceIntegrity.hasUnstablePriceHistory(List.of(t, t.plusMinutes(60))));
    }

    @Test
    void unsortedInputIsHandled() {
        LocalDateTime t = LocalDateTime.parse("2026-09-05T13:00:00");
        assertTrue(PriceIntegrity.hasUnstablePriceHistory(List.of(t.plusDays(7), t, t.plusMinutes(3))));
    }
}
