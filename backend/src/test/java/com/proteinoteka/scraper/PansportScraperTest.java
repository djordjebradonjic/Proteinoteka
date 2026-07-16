package com.proteinoteka.scraper;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.BaseScraperEnricher;
import com.proteinoteka.service.NutritionParserService;
import com.proteinoteka.service.PansportScraper;
import com.proteinoteka.util.WeightParser;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class PansportScraperTest {

    @Mock
    private NutritionParserService nutritionParser;

    @Mock
    private BaseScraperEnricher baseEnricher;

    private PansportScraper pansportScraper;
    private Document mockDoc;

    @BeforeEach
    void setUp() throws IOException {
        pansportScraper = new PansportScraper(nutritionParser, baseEnricher, null, null, new WeightParser());
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