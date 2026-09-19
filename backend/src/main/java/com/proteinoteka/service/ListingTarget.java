package com.proteinoteka.service;

import java.util.function.IntFunction;

/**
 * One listing a store scraper walks during a scrape run: the product type it yields and where to
 * read it from. A scraper that covers several supplement families returns several targets from
 * {@link StoreScraper#listingTargets()}; {@code ScraperService} walks them one after another inside
 * one browser context and proxy session, so a second family costs one more listing, not a second run.
 *
 * @param categoryTrusted the listing is a category dedicated to {@code productType}, so an item whose
 *                        name lacks the family's keyword ("CreaMASS") is still accepted
 */
public record ListingTarget(String productType, ListingSource source, boolean categoryTrusted) {

    public sealed interface ListingSource permits HtmlPaged, WooStoreApi {}

    /** Category pages read with the scraper's own HTML parser; {@code pageUrl} takes a 0-based page number. */
    public record HtmlPaged(String baseUrl, IntFunction<String> pageUrl) implements ListingSource {}

    /**
     * A WooCommerce category read through the public Store API ({@code /wp-json/wc/store/v1/products}):
     * the whole category with descriptions and variant prices in one or two small JSON requests,
     * instead of a browser navigation per listing page and per product.
     */
    public record WooStoreApi(String origin, String categorySlug) implements ListingSource {}

    public static ListingTarget html(String productType, String baseUrl, IntFunction<String> pageUrl) {
        return new ListingTarget(productType, new HtmlPaged(baseUrl, pageUrl), true);
    }

    public static ListingTarget woo(String productType, String origin, String categorySlug) {
        return new ListingTarget(productType, new WooStoreApi(origin, categorySlug), true);
    }
}
