package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.service.producttype.ProductTypeProfile;
import org.jsoup.nodes.Document;

import java.util.List;
import java.util.Set;

public interface StoreScraper {
    String getStoreName();

    // The `stores` table row this scraper's products attach to. Defaults to getStoreName().
    // A second scraper for the SAME physical store overrides only this to point back at the shared
    // row, while getStoreName() stays distinct for scheduling/ScrapeLog identity. Another product
    // family of a store is normally just another listingTargets() entry, not a second scraper.
    default String getStoreRowName() { return getStoreName(); }

    // Product family this scraper covers. Used to scope stale-URL detection so a second
    // scraper sharing a store row (see getStoreRowName()) doesn't mark the OTHER family's
    // products as missing just because this run's listing never contained their URLs.
    default String getProductType() { return "protein"; }

    String getBaseUrl();

    default String getMarket() { return "rs"; }

    default String getCurrency() { return "RSD"; }

    List<Product> scrape(Page page, Document doc);

    default List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        return scrape(page, doc);
    }

    // The listings this store is walked through in ONE scrape run, primary type first. The default is
    // the single protein listing every scraper already describes with getBaseUrl()/buildPageUrl(), so
    // scrapers that don't cover a second product family need no change. A scraper that does returns
    // one target per family (see ListingTarget); ScraperService runs them in a single browser context
    // and proxy session, and keeps stale-product tracking separate per type.
    default List<ListingTarget> listingTargets() {
        return List.of(primaryListingTarget());
    }

    // The listing getBaseUrl()/buildPageUrl() describe, for scrapers that add further targets to it.
    default ListingTarget primaryListingTarget() {
        return ListingTarget.html(getProductType(), getBaseUrl(), this::buildPageUrl);
    }

    // Type-aware variant of scrape() for HtmlPaged targets. `profile` is the family being scraped:
    // a scraper that serves more than one family must use profile.rejectReason(...) instead of the
    // protein-only BaseScraperEnricher.isNonProteinProduct(...), and skip protein nutrition parsing.
    default List<Product> scrape(ListingTarget target, ProductTypeProfile profile,
                                 Page page, Document doc, Set<String> skipUrls) {
        return scrape(page, doc, skipUrls);
    }

    boolean hasNextPage(Document doc);

    String buildPageUrl(int page);

    default boolean usePlaywrightForListing() {
        return true;
    }

    // Route the Playwright browser context through the iProyal residential proxy.
    // Default false — proxy bandwidth costs money, so only opt in for stores whose
    // anti-bot protection actually requires a non-datacenter IP (e.g. Cloudflare Turnstile).
    default boolean requiresProxy() {
        return false;
    }

    // BCP-47 locale for the browser context — controls navigator.language and Accept-Language.
    // Override for non-Serbian markets so the locale matches the site's expected visitor profile.
    default String getLocale() { return "sr-RS"; }

    // IANA timezone for the browser context — used by Intl APIs and date formatting.
    default String getTimezoneId() { return "Europe/Belgrade"; }

    // Accept-Language header sent on every request. Should match getLocale().
    default String getAcceptLanguage() { return "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7"; }

    // Override in scrapers where the product grid is rendered by JS after DOMContentLoaded
    default void waitForListing(Page page) {}

    // Return true for scrapers where nutrition is in images (not HTML tables).
    // ScraperService will skip detail page fetches for products that already
    // have brand + description in DB, even if nutrition fields are incomplete.
    default boolean skipDetailIfDescriptionExists() { return false; }
}
