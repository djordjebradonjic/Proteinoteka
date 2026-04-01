package com.proteinoteka.scraper;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.PansportScraper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PansportScraperTest {
    private PansportScraper pansportScraper;
    private Document mockDoc;

    @BeforeEach
    void setUp() throws IOException {
        pansportScraper = new PansportScraper();
        File htmlFile = new File("src/test/resources/html/pansport_test.html");
        mockDoc = Jsoup.parse(htmlFile, StandardCharsets.UTF_8.name());
    }

    @Test
    void shouldScrapeAllProductsFromHtml() {

        List<Product> products = pansportScraper.scrape(null, mockDoc);

        assertNotNull(products);
        assertFalse(products.isEmpty(), "Lista proizvoda ne sme biti prazna!");


        Product firstProduct = products.get(0);
        assertNotNull(firstProduct.getName());
        assertNotNull(firstProduct.getPrice());
        assertTrue(firstProduct.getUrl().contains("pansport.rs"));

        System.out.println("Test uspešan! Pronađeno proizvoda: " + products.size());
    }
}
