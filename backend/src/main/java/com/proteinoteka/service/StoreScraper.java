package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import org.jsoup.nodes.Document;

import java.util.List;

public interface StoreScraper {
    String getStoreName();

    String getBaseUrl();

    List<Product> scrape(Page page, Document doc);

    boolean hasNextPage(Document doc);

    String buildPageUrl(int page);
}
