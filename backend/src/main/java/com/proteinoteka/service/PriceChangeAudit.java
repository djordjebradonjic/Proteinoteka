package com.proteinoteka.service;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.PriceIntegrity;
import com.proteinoteka.util.ProductLineMatcher;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Read-only audit of the data behind "price drop" / "price increase" features (the
 * {@code lastPriceDropPct} sort, /price-drops, the newsletter digest). Pure (no Spring/DB) so it is
 * unit-testable; DataQualityService feeds it the catalogue.
 *
 * <p>Each finding is one line {@code CODE — id=… [market] 'name' …}. They point at rows whose
 * "drop" is not a real repricing: history that flaps within a scrape run, a price that moved too
 * far to be the same item, a stored percentage the current rules would not produce, and rows whose
 * name no longer matches the (frozen-at-creation) slug — i.e. the row was re-pointed at another
 * product, which is what makes the old history price meaningless.
 */
public final class PriceChangeAudit {

    private PriceChangeAudit() {}

    public static List<String> run(List<Product> products) {
        List<String> issues = new ArrayList<>();
        for (Product p : products) {
            List<PriceHistory> history = p.getPriceHistories() == null ? List.of() : p.getPriceHistories();
            String tag = String.format("id=%s [%s] '%s'", p.getId(), p.getMarket(), p.getName());

            if (!history.isEmpty()) {
                if (PriceIntegrity.hasUnstablePriceHistory(history.stream().map(PriceHistory::getTimestamp).toList())) {
                    issues.add(String.format("PRICE_HISTORY_FLAPPING — %s has price_history rows less than %d h apart "
                                    + "(one scrape run wrote it twice); see ops/sql/cleanup_flapping_price_history.sql",
                            tag, PriceIntegrity.UNSTABLE_HISTORY_WINDOW.toHours()));
                }
                history.stream()
                        .filter(h -> h.getTimestamp() != null && h.getNumericPrice() != null && h.getNumericPrice() > 0)
                        .max(Comparator.comparing(PriceHistory::getTimestamp))
                        .ifPresent(last -> {
                            if (p.getNumericPrice() != null && p.getNumericPrice() > 0
                                    && !PriceIntegrity.isCredibleChange(last.getNumericPrice(), p.getNumericPrice())) {
                                issues.add(String.format(Locale.ROOT,
                                        "PRICE_CHANGE_IMPLAUSIBLE — %s last history price %.2f vs current %.2f (%.0f%%) — "
                                                + "probably a different product/pack on the same row; delete its price_history",
                                        tag, last.getNumericPrice(), p.getNumericPrice(),
                                        (p.getNumericPrice() - last.getNumericPrice()) / last.getNumericPrice() * 100));
                            }
                        });
            }

            PriceIntegrity.LastChange expected = PriceIntegrity.lastChange(p.getNumericPrice(), history);
            if (!expected.matches(p.getLastPriceDropPct(), p.getLastPriceIncreasePct())) {
                issues.add(String.format(Locale.ROOT,
                        "PRICE_CHANGE_STALE — %s stored drop=%s increase=%s but history supports drop=%s increase=%s; "
                                + "run POST /api/admin/recalculate-price-changes",
                        tag, fmt(p.getLastPriceDropPct()), fmt(p.getLastPriceIncreasePct()),
                        fmt(expected.dropPct()), fmt(expected.increasePct())));
            }

            if (p.getCanonicalSlug() != null && !p.getCanonicalSlug().isBlank() && !history.isEmpty()
                    && !ProductLineMatcher.sameProductLine(
                            p.getName(), p.getBrand(), p.getCanonicalSlug().replace('-', ' '), p.getBrand())) {
                issues.add(String.format("IDENTITY_DRIFT — %s name no longer matches its creation-time slug '%s' — "
                        + "the row was probably re-pointed at another product; its price history and nutrition may belong to the old one",
                        tag, p.getCanonicalSlug()));
            }
        }
        return issues;
    }

    private static String fmt(Double pct) {
        return pct == null ? "null" : String.format(Locale.ROOT, "%.0f%%", pct * 100);
    }
}
