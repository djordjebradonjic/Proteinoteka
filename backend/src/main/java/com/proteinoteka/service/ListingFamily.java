package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.producttype.ProductTypeProfile;
import com.proteinoteka.service.producttype.ProductTypes;

import java.util.Optional;

/**
 * The product family a store scraper is walking a listing for, as its parse and detail code needs
 * it: what to reject before a detail page is fetched, and which enrichment chain applies.
 *
 * <p>{@code profile} is null on the legacy protein-only entry points ({@code scrape(page, doc[, skipUrls])}),
 * which keep the store's original {@code isNonProteinProduct} rule.
 */
record ListingFamily(String productType, ProductTypeProfile profile, boolean categoryTrusted) {

    /** What the two/three-argument {@code scrape} overloads scrape: protein, by the store's own rule. */
    static final ListingFamily PROTEIN = new ListingFamily(ProductTypes.PROTEIN, null, false);

    static ListingFamily of(ListingTarget target, ProductTypeProfile profile) {
        return new ListingFamily(profile.code(), profile, target.categoryTrusted());
    }

    boolean isCreatine() {
        return ProductTypes.CREATINE.equals(productType);
    }

    /**
     * Empty when {@code stub} may be scraped as this family. Judged on the listing title alone so a
     * detail page (a browser navigation, and proxy traffic on some stores) is never spent on an item
     * {@code saveOrUpdateProduct} would refuse anyway.
     */
    Optional<String> rejectReason(Product stub, BaseScraperEnricher baseEnricher) {
        if (profile != null) return profile.rejectReason(stub, categoryTrusted);
        return baseEnricher.isNonProteinProduct(stub.getName())
                ? Optional.of("not a protein product") : Optional.empty();
    }
}
