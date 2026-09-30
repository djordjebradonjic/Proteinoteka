package com.proteinoteka.util;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Objects;

/**
 * Pure rules for "is this price still current enough to show". Kept free of Spring/JPA
 * dependencies so it is unit-testable in isolation.
 *
 * <p>Every store is scraped once a week, so a price can lag the shop by up to 7 days. Two
 * failures this guards against:
 * <ul>
 *   <li>a store whose scrapes keep failing (Polleo Sport behind Cloudflare since July): its rows
 *       keep their last price forever, and {@code missed_scrapes} never grows because a blocked
 *       run never gets to compare listings;</li>
 *   <li>the "biggest price drop" section showing sales that started months ago or already ended
 *       (GymBeam 2026-09: three drops still listed after the shop was back to full price).</li>
 * </ul>
 */
public final class ListingFreshness {

    /**
     * A product not refreshed by a scrape within this window is left out of listings: two
     * weekly cycles, so one failed run never hides a store.
     */
    public static final Duration MAX_LISTING_AGE = Duration.ofDays(14);

    /**
     * A product not refreshed within this window is left out of the ranked sections
     * ({@code /top}, {@code /top-value}) — one weekly cycle, so a ranking can't surface a price
     * the store has already moved past.
     */
    public static final Duration MAX_RANKING_AGE = Duration.ofDays(7);

    /**
     * A price drop older than this is no longer news — the section is about current deals. One
     * weekly cycle: a drop is shown until the store's next scrape could have seen the sale end.
     */
    public static final Duration MAX_DROP_AGE = Duration.ofDays(7);

    /**
     * A deal is only shown if the last scrape of its store confirmed the product: one weekly
     * cycle plus a day of slack for the randomized scrape window.
     */
    public static final Duration MAX_DEAL_CONFIRMATION_AGE = Duration.ofDays(8);

    private ListingFreshness() {}

    /** Oldest {@code lastUpdated} a listed product may have. */
    public static LocalDateTime listingCutoff(LocalDateTime now) {
        return now.minus(MAX_LISTING_AGE);
    }

    /** Oldest {@code lastUpdated} a ranked ({@code /top}, {@code /top-value}) product may have. */
    public static LocalDateTime rankingCutoff(LocalDateTime now) {
        return now.minus(MAX_RANKING_AGE);
    }

    /**
     * @return true if the product's current price was confirmed by a recent scrape and the
     *         product was found by its store's latest run — the bar for a "deal" section
     */
    public static boolean isConfirmedForDeals(Product p, LocalDateTime now) {
        if (p.getLastUpdated() == null || p.getLastUpdated().isBefore(now.minus(MAX_DEAL_CONFIRMATION_AGE))) {
            return false;
        }
        return p.getMissedScrapes() == null || p.getMissedScrapes() == 0;
    }

    /**
     * A price_history row is written when a scrape sees a changed price, so the newest row's
     * timestamp is when the current price appeared.
     *
     * @return true if the current price appeared within {@link #MAX_DROP_AGE}
     */
    public static boolean isRecentPriceChange(Collection<PriceHistory> history, LocalDateTime now) {
        if (history == null) return false;
        return history.stream()
                .map(PriceHistory::getTimestamp)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .map(t -> !t.isBefore(now.minus(MAX_DROP_AGE)))
                .orElse(false);
    }

    /**
     * Variant rows of one store page differ only in the query ({@code ?pakovanje=900g} vs
     * {@code ?pakovanje=1800g}); a deal section should show that page once.
     */
    public static String pageKey(String url) {
        if (url == null) return null;
        int q = url.indexOf('?');
        String base = q >= 0 ? url.substring(0, q) : url;
        int hash = base.indexOf('#');
        return hash >= 0 ? base.substring(0, hash) : base;
    }
}
