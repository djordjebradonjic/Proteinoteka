package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class GymBeamScraperTest {

    @Mock
    private NutritionParserService nutritionParser;

    @Mock
    private BaseScraperEnricher baseEnricher;

    @Mock
    private ProxyAwareHttpClient httpClient;

    private GymBeamScraper scraper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        scraper = new GymBeamScraper(nutritionParser, baseEnricher, httpClient);
    }

    @Test
    void unwrapDevalue_unwrapsNestedDevalueStructure() throws Exception {
        String json = """
                [0, {
                  "name": [0, "Gold Standard"],
                  "tags": [1, [[0, "whey"], [0, "isolate"]]],
                  "nested": [0, {"weight": [0, 2250]}]
                }]
                """;
        JsonNode raw = objectMapper.readTree(json);

        JsonNode unwrapped = scraper.unwrapDevalue(raw);

        assertEquals("Gold Standard", unwrapped.path("name").asText());
        assertEquals("whey", unwrapped.path("tags").get(0).asText());
        assertEquals("isolate", unwrapped.path("tags").get(1).asText());
        assertEquals(2250, unwrapped.path("nested").path("weight").asInt());
    }

    @Test
    void extractProps_findsProductPageClientIslandAndParsesJson() {
        String html = "<html><body>" +
                "<astro-island component-export=\"SomethingElse\" props='{\"x\":1}'></astro-island>" +
                "<astro-island component-export=\"ProductPageClient\" props='{\"productData\":[0,{\"name\":[0,\"Test Product\"]}]}'></astro-island>" +
                "</body></html>";
        Document doc = Jsoup.parse(html);

        JsonNode props = scraper.extractProps(doc);

        assertNotNull(props);
        JsonNode productData = scraper.unwrapDevalue(props.path("productData"));
        assertEquals("Test Product", productData.path("name").asText());
    }

    @Test
    void expandByPackageWeight_groupsByWeightFiltersUnder500gAndOutOfStock() throws Exception {
        File file = new File("src/test/resources/gymbeam/gold_standard_productdata.json");
        JsonNode productData = objectMapper.readTree(file);

        Product stub = new Product();
        stub.setUrl("https://gymbeam.rs/290-100-whey-gold-standard-protein-optimum-nutrition.html");
        stub.setName("100% Whey Gold Standard - Optimum Nutrition");

        List<Product> variants = scraper.expandByPackageWeight(productData, stub);

        // 2250g (all OOS), 450g (<500g), 896g (all OOS), 2015g (all OOS in fixture) excluded.
        // Only 4540g and 768g remain (both in stock, >=500g).
        assertEquals(2, variants.size());

        Product v0 = variants.get(0);
        assertEquals("4540g", v0.getPackage_weight().get(0));
        assertEquals(4540.0, v0.getPrimaryWeightGrams());
        assertEquals("22390", v0.getPrice());
        assertEquals(stub.getUrl() + "?pakovanje=4540g", v0.getUrl());
        assertTrue(v0.getFlavours().contains("dvostruko bogata čokolada"));
        assertTrue(v0.getFlavours().contains("ukusna jagoda"));

        Product v1 = variants.get(1);
        assertEquals("768g", v1.getPackage_weight().get(0));
        assertEquals(768.0, v1.getPrimaryWeightGrams());
        assertEquals("5190", v1.getPrice());
        assertEquals(stub.getUrl() + "?pakovanje=768g", v1.getUrl());
        assertTrue(v1.getFlavours().contains("banana krem"));
        assertTrue(v1.getFlavours().contains("čokolada-puter od kikirikija"));

        for (Product v : variants) {
            assertEquals("100% Whey Gold Standard - Optimum Nutrition", v.getName());
        }
    }

    @Test
    void extractNutritionFromTable_usesExplicit100gColumnWhenPresent() throws Exception {
        File htmlFile = new File("src/test/resources/gymbeam/anabolic_whey_description.html");
        Document descDoc = Jsoup.parse(htmlFile, StandardCharsets.UTF_8.name());

        Product p = new Product();
        scraper.extractNutritionFromTable(descDoc, p);

        assertEquals(50.2, p.getProteinPer100g());
        assertEquals(3.8, p.getFatPer100g());
        assertEquals(18.2, p.getSugarPer100g());
        assertEquals(325.0, p.getCaloriePer100g());
    }

    @Test
    void extractNutritionFromTable_convertsServingSizeOnlyTableToPer100g() throws Exception {
        File htmlFile = new File("src/test/resources/gymbeam/gold_standard_description.html");
        Document descDoc = Jsoup.parse(htmlFile, StandardCharsets.UTF_8.name());

        Product p = new Product();
        scraper.extractNutritionFromTable(descDoc, p);

        // Table is "1 porcija (31 g)": proteini=24g, masti=1.4g, šećeri=0.7g, 116 kcal
        assertEquals(77.4, p.getProteinPer100g());
        assertEquals(4.5, p.getFatPer100g());
        assertEquals(2.3, p.getSugarPer100g());
        assertEquals(374.2, p.getCaloriePer100g());
    }
}
