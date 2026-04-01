package com.proteinoteka.scraper;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.ProteiniSiScraper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ProteiniSIScraperTest {
    private ProteiniSiScraper scraper;
    private Document mockDoc;

    @BeforeEach
    void setUp() throws IOException {
        scraper = new ProteiniSiScraper();
        File htmlFile = new File("src/test/resources/html/proteinisi_test.html");
        mockDoc = Jsoup.parse(htmlFile, StandardCharsets.UTF_8.name());
    }

    @Test
    void shouldParseProteinisiProductsCorrectly() {
        List<Product> products = scraper.scrape(null, mockDoc);

        assertNotNull(products);
        assertFalse(products.isEmpty(), "It should find products on the page");

        Product p = products.get(0);

        assertNotNull(p.getPrice(), "Price shouldn't be null");
        assertFalse(p.getPrice().contains("RSD"), "Price should not contain RSD ");


        System.out.println("Proteini.si test passed! First product: " + p.getName() + " - " + p.getPrice());
    }

}
