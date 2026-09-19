package com.proteinoteka.util;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Pure guards that keep scraper noise out of price_history, so it can't surface as a fake
 * "price drop". Kept free of Spring/JPA dependencies so it is unit-testable in isolation.
 *
 * <p>The failure they prevent: one DB row receiving two different prices in a single scrape
 * run (A then B), which writes two history rows per run and re-"discovers" the same drop every
 * week. Two known sources:
 * <ul>
 *   <li>the URL-changed fallbacks in {@code ScraperService.saveOrUpdateProduct} re-pointing an
 *       existing row at a different product with the same name/weight (e.g. Lama "5 Stars
 *       100% Whey Isolate" 7.400 vs "Shadowhey Isolate" 10.900, both 2 kg);</li>
 *   <li>a scraper emitting the same URL twice in one listing with different prices.</li>
 * </ul>
 */
public final class PriceIntegrity {

    /**
     * A URL-changed fallback match is only trusted if the price is nearly unchanged. A genuine
     * SKU/URL change of the same physical item keeps (roughly) its price, whereas a different
     * product that merely shares name words and weight usually doesn't. When the check fails the
     * scraped item becomes a new product instead of hijacking the old row and its history.
     */
    public static final double MAX_REPOINT_PRICE_DEVIATION = 0.10;

    /**
     * A price move bigger than this (relative to the old price) is not shown as a drop/increase.
     * Real protein-supplement repricings and sales stay well below it; moves beyond it are
     * practically always one DB row switching to a different product or pack size, whose old
     * price says nothing about the new one (e.g. GymBeam "Mutant Whey" 7190 → "Mutant Mass" 3490
     * on the same row). Unlike flapping these can be weeks apart, so the timing guard misses them.
     */
    public static final double MAX_CREDIBLE_PRICE_CHANGE = 0.50;

    /** Two history rows closer than this can't be two real repricings — see hasUnstablePriceHistory. */
    public static final Duration UNSTABLE_HISTORY_WINDOW = Duration.ofHours(1);

    private PriceIntegrity() {}

    /**
     * @param existingPrice price currently stored on the candidate row
     * @param scrapedPrice  price just scraped for the item that would take over the row
     * @return true if re-pointing the row at the scraped item can't fabricate a price change
     */
    public static boolean isSafeRepoint(Double existingPrice, Double scrapedPrice) {
        if (existingPrice == null || existingPrice <= 0 || scrapedPrice == null || scrapedPrice <= 0) {
            // Nothing to compare against, so no price change (and no fake drop) can be recorded.
            return true;
        }
        return Math.abs(scrapedPrice - existingPrice) / existingPrice <= MAX_REPOINT_PRICE_DEVIATION;
    }

    /**
     * @return true if going from {@code from} to {@code to} is a believable repricing of one and
     *         the same item (see {@link #MAX_CREDIBLE_PRICE_CHANGE}); false when either price is
     *         unusable or the move is too large to be anything but an identity change
     */
    public static boolean isCredibleChange(Double from, Double to) {
        if (from == null || from <= 0 || to == null || to <= 0) return false;
        return Math.abs(to - from) / from <= MAX_CREDIBLE_PRICE_CHANGE;
    }

    /** What {@code products.last_price_drop_pct / last_price_increase_pct} may hold (both null = neither). */
    public record LastChange(Double dropPct, Double increasePct) {
        public static final LastChange NONE = new LastChange(null, null);

        /** Percentages are doubles computed in SQL (V52/V53) and Java, so compare with a tolerance. */
        private static final double EPSILON = 1e-6;

        /** @return true if the stored columns already hold what this change implies */
        public boolean matches(Double storedDropPct, Double storedIncreasePct) {
            return close(dropPct, storedDropPct) && close(increasePct, storedIncreasePct);
        }

        private static boolean close(Double a, Double b) {
            if (a == null || b == null) return a == null && b == null;
            return Math.abs(a - b) < EPSILON;
        }
    }

    /**
     * Derives the denormalised "last price change" columns from the stored history the way the
     * scraper would have written them, but only when the change is trustworthy: the history must
     * not be flapping ({@link #hasUnstablePriceHistory}) and the move from the most recent history
     * row to the current price must be credible ({@link #isCredibleChange}). Used to repair
     * columns populated before those guards existed.
     */
    public static LastChange lastChange(Double currentPrice, Collection<PriceHistory> history) {
        if (currentPrice == null || currentPrice <= 0 || history == null) return LastChange.NONE;
        List<PriceHistory> valid = history.stream()
                .filter(h -> h.getTimestamp() != null && h.getNumericPrice() != null && h.getNumericPrice() > 0)
                .sorted(java.util.Comparator.comparing(PriceHistory::getTimestamp)
                        .thenComparing(h -> h.getId() == null ? 0L : h.getId()))
                .toList();
        if (valid.isEmpty()) return LastChange.NONE;
        if (hasUnstablePriceHistory(valid.stream().map(PriceHistory::getTimestamp).toList())) return LastChange.NONE;

        double prev = valid.get(valid.size() - 1).getNumericPrice();
        if (!isCredibleChange(prev, currentPrice)) return LastChange.NONE;
        if (currentPrice < prev) return new LastChange((prev - currentPrice) / prev, null);
        if (currentPrice > prev) return new LastChange(null, (currentPrice - prev) / prev);
        return LastChange.NONE;
    }

    /**
     * Collapses items sharing a URL to a single one, keeping the lowest valid price ("starting
     * from", the convention the variant scrapers already use). Order of first appearance is
     * preserved; items without a URL are passed through untouched.
     */
    public static List<Product> keepLowestPricePerUrl(List<Product> products, Function<Product, Double> priceOf) {
        Map<String, Integer> indexByUrl = new HashMap<>();
        List<Product> result = new ArrayList<>(products.size());
        for (Product p : products) {
            String url = p.getUrl();
            if (url == null || url.isBlank()) {
                result.add(p);
                continue;
            }
            Integer at = indexByUrl.get(url);
            if (at == null) {
                indexByUrl.put(url, result.size());
                result.add(p);
                continue;
            }
            if (isCheaper(priceOf.apply(p), priceOf.apply(result.get(at)))) {
                result.set(at, p);
            }
        }
        return result;
    }

    private static boolean isCheaper(Double candidate, Double current) {
        if (candidate == null || candidate <= 0) return false;
        return current == null || current <= 0 || candidate < current;
    }

    /**
     * A price_history row is only written when a scrape sees a changed price, and a product is
     * scraped once per run — so two rows minutes apart mean the same run wrote the row twice
     * (A→B→A flapping), not two real repricings. Products with such history must not be shown as
     * "price drops". Also neutralises flapping already stored in the DB.
     */
    public static boolean hasUnstablePriceHistory(Collection<LocalDateTime> timestamps) {
        List<LocalDateTime> sorted = timestamps.stream()
                .filter(t -> t != null)
                .sorted()
                .toList();
        for (int i = 1; i < sorted.size(); i++) {
            if (Duration.between(sorted.get(i - 1), sorted.get(i)).compareTo(UNSTABLE_HISTORY_WINDOW) < 0) {
                return true;
            }
        }
        return false;
    }
}
