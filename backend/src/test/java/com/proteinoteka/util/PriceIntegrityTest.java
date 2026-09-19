package com.proteinoteka.util;

import com.proteinoteka.model.PriceHistory;
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

    // ── isCredibleChange ─────────────────────────────────────────────────────────

    @Test
    void crossProductMovesAreNotCredible() {
        // GymBeam RS "Mutant Whey" 7190 -> "Mutant Mass" 3490 on the same row (-51%).
        assertFalse(PriceIntegrity.isCredibleChange(7190.0, 3490.0));
        // GymBeam HR the same pair: 63.95 -> 28.95 EUR (-55%).
        assertFalse(PriceIntegrity.isCredibleChange(63.95, 28.95));
        // Soy Isolate history 4490 -> 1600 (-64%).
        assertFalse(PriceIntegrity.isCredibleChange(4490.0, 1600.0));
    }

    @Test
    void ordinaryRepricingsAreCredible() {
        assertTrue(PriceIntegrity.isCredibleChange(4390.0, 3390.0));   // -23%
        assertTrue(PriceIntegrity.isCredibleChange(35.95, 25.15));     // -30% sale
        assertTrue(PriceIntegrity.isCredibleChange(5000.0, 7500.0));   // +50% boundary
        assertTrue(PriceIntegrity.isCredibleChange(5000.0, 2500.0));   // -50% boundary
    }

    @Test
    void justBeyondFiftyPercentIsNotCredible() {
        assertFalse(PriceIntegrity.isCredibleChange(5000.0, 2499.0));
        assertFalse(PriceIntegrity.isCredibleChange(5000.0, 7501.0));
    }

    @Test
    void unusableInputsAreNotCredible() {
        assertFalse(PriceIntegrity.isCredibleChange(null, 100.0));
        assertFalse(PriceIntegrity.isCredibleChange(100.0, null));
        assertFalse(PriceIntegrity.isCredibleChange(0.0, 100.0));
        assertFalse(PriceIntegrity.isCredibleChange(100.0, -1.0));
    }

    // ── lastChange ───────────────────────────────────────────────────────────────

    private static PriceHistory row(long id, double price, String ts) {
        PriceHistory h = new PriceHistory();
        h.setId(id);
        h.setNumericPrice(price);
        h.setTimestamp(LocalDateTime.parse(ts));
        return h;
    }

    @Test
    void lastChangeReportsCredibleDrop() {
        PriceIntegrity.LastChange c = PriceIntegrity.lastChange(3390.0, List.of(row(1, 4390.0, "2026-06-24T11:07:00")));
        assertEquals(1000.0 / 4390.0, c.dropPct(), 1e-9);
        assertEquals(null, c.increasePct());
    }

    @Test
    void lastChangeReportsCredibleIncrease() {
        PriceIntegrity.LastChange c = PriceIntegrity.lastChange(5000.0, List.of(row(1, 4000.0, "2026-06-24T11:07:00")));
        assertEquals(null, c.dropPct());
        assertEquals(0.25, c.increasePct(), 1e-9);
    }

    @Test
    void lastChangeUsesMostRecentHistoryRow() {
        PriceIntegrity.LastChange c = PriceIntegrity.lastChange(3500.0, List.of(
                row(2, 4200.0, "2026-08-18T13:41:00"),
                row(1, 3000.0, "2026-07-01T10:00:00")));
        assertEquals(700.0 / 4200.0, c.dropPct(), 1e-9);
    }

    @Test
    void lastChangeIsEmptyForImplausibleMove() {
        // Row re-pointed from "Mutant Whey" (7190) to "Mutant Mass" (3490): weeks apart, so only the cap catches it.
        assertEquals(PriceIntegrity.LastChange.NONE,
                PriceIntegrity.lastChange(3490.0, List.of(row(1, 7190.0, "2026-08-22T14:28:00"))));
    }

    @Test
    void lastChangeIsEmptyForFlappingHistory() {
        assertEquals(PriceIntegrity.LastChange.NONE, PriceIntegrity.lastChange(7400.0, List.of(
                row(1, 10900.0, "2026-08-06T12:01:00"),
                row(2, 7400.0, "2026-08-06T12:02:00"),
                row(3, 10900.0, "2026-08-13T13:47:00"))));
    }

    @Test
    void lastChangeIsEmptyWithoutHistoryOrPrice() {
        assertEquals(PriceIntegrity.LastChange.NONE, PriceIntegrity.lastChange(100.0, List.of()));
        assertEquals(PriceIntegrity.LastChange.NONE, PriceIntegrity.lastChange(null, List.of(row(1, 90.0, "2026-08-22T14:28:00"))));
        assertEquals(PriceIntegrity.LastChange.NONE, PriceIntegrity.lastChange(100.0, List.of(row(1, 100.0, "2026-08-22T14:28:00"))));
    }

    @Test
    void lastChangeMatchesStoredValuesWithinRoundingTolerance() {
        PriceIntegrity.LastChange c = PriceIntegrity.lastChange(3390.0, List.of(row(1, 4390.0, "2026-06-24T11:07:00")));
        assertTrue(c.matches(1000.0 / 4390.0, null));
        assertTrue(c.matches(1000.0 / 4390.0 + 1e-9, null));
        assertFalse(c.matches(0.228, null));        // rounded by hand: 0.2277904... is not 0.228
        assertFalse(c.matches(null, null));
        assertFalse(c.matches(1000.0 / 4390.0, 0.1));
        assertTrue(PriceIntegrity.LastChange.NONE.matches(null, null));
        assertFalse(PriceIntegrity.LastChange.NONE.matches(0.3, null));
    }
}
