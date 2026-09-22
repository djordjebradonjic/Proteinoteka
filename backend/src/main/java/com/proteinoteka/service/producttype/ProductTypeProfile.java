package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;

import java.util.Optional;

/**
 * Everything {@code ScraperService} needs to know that differs between supplement families.
 * The scrape/save pipeline (price history, stale detection, grouping, slugs) is shared; a family
 * only supplies its own acceptance rule, sanity ranges, price floor and type-specific fields.
 *
 * <p>Adding a family (pre-workout, BCAA, vitamins) means one new bean implementing this interface
 * plus listing targets in the store scrapers — no branching on the type string in the pipeline.
 */
public interface ProductTypeProfile {

    /** Value stored in {@code products.product_type}. */
    String code();

    /**
     * Empty when the scraped item belongs to this family; otherwise why it must not be stored.
     *
     * @param categoryTrusted the item came from a listing dedicated to this family (e.g. a store's
     *                        creatine category), so a missing keyword in its name is not suspicious.
     */
    Optional<String> rejectReason(Product scraped, boolean categoryTrusted);

    /** Range checks and derived fields on a freshly scraped item, before price validation. */
    void sanitize(Product scraped, String storeName);

    /** Lowest plausible shelf price in {@code currency}; below it the item is a sachet or single serving. */
    double minPrice(String currency);

    /**
     * Fills fields the listing did not carry from the stored row (the detail page is often skipped).
     *
     * @return false when the item still lacks what this family requires and must not be stored.
     */
    boolean restoreFromStored(Product scraped, Optional<Product> stored, String storeName);

    /** Copies family-specific fields of a fresh scrape onto the stored row. Price/name/image are merged by the caller. */
    void mergeInto(Product existing, Product scraped);

    /**
     * True when opening the detail page again would add nothing for this stored row.
     *
     * @param nutritionInImages the store publishes its nutrition table as an image, so the text of the
     *                          detail page can never fill more than the core fields
     */
    boolean isDetailComplete(Product stored, boolean nutritionInImages);
}
