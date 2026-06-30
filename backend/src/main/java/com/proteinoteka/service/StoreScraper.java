package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import org.jsoup.nodes.Document;

import java.util.List;
import java.util.Set;

public interface StoreScraper {
    String getStoreName();

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

    // Override in scrapers where the product grid is rendered by JS after DOMContentLoaded
    default void waitForListing(Page page) {}

    // Return true for scrapers where nutrition is in images (not HTML tables).
    // ScraperService will skip detail page fetches for products that already
    // have brand + description in DB, even if nutrition fields are incomplete.
    default boolean skipDetailIfDescriptionExists() { return false; }
}
