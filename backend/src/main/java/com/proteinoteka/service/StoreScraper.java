package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import org.jsoup.nodes.Document;

import java.util.List;
import java.util.Set;

public interface StoreScraper {
    String getStoreName();

    // The `stores` table row this scraper's products attach to. Defaults to getStoreName().
    // A second scraper covering another product family for the SAME physical store (e.g. a
    // "GymBeam Kreatin" scraper alongside "GymBeam") overrides only this to point back at the
    // shared row, while getStoreName() stays distinct for scheduling/ScrapeLog identity.
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

    // Override in scrapers where the product grid is rendered by JS after DOMContentLoaded
    default void waitForListing(Page page) {}

    // Return true for scrapers where nutrition is in images (not HTML tables).
    // ScraperService will skip detail page fetches for products that already
    // have brand + description in DB, even if nutrition fields are incomplete.
    default boolean skipDetailIfDescriptionExists() { return false; }
}
