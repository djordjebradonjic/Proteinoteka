package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class MyProteinScraperTest {

    @Mock
    private NutritionParserService nutritionParser;

    @Mock
    private BaseScraperEnricher baseEnricher;

    @Mock
    private ProxyAwareHttpClient httpClient;

    private MyProteinScraper scraper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        scraper = new MyProteinScraper(nutritionParser, baseEnricher, httpClient);
    }

    @Test
    void extractMasterData_findsScriptAndParsesJson() {
        String html = "<html><body><script>" +
                "window.siteObj = {\"currency\":\"RSD\"}; " +
                "const masterData = {\"pageTitle\":\"Test Product\",\"masterSku\":123,\"note\":\"a { weird } string\"};" +
                "const breadcrumbsCategories = [];" +
                "</script></body></html>";
        Document doc = Jsoup.parse(html);

        JsonNode masterData = scraper.extractMasterData(doc);

        assertNotNull(masterData);
        assertEquals("Test Product", masterData.path("pageTitle").asText());
        assertEquals(123, masterData.path("masterSku").asInt());
        assertEquals("a { weird } string", masterData.path("note").asText());
    }

    @Test
    void extractMasterData_returnsNullWhenNoMasterDataScript() {
        Document doc = Jsoup.parse("<html><body><script>console.log('nothing here');</script></body></html>");

        assertNull(scraper.extractMasterData(doc));
    }

    @Test
    void expandByVariants_groupsByWeightFiltersUnder500gAndOutOfStock() throws Exception {
        File file = new File("src/test/resources/myprotein/impact_whey_masterdata.json");
        JsonNode masterData = objectMapper.readTree(file);

        Product stub = new Product();
        stub.setUrl("https://www.myprotein.rs/p/sports-nutrition/impact-whey-protein/10530943/");
        stub.setName("Impact Whey Protein");

        List<Product> variants = scraper.expandByVariants(masterData, stub);

        // 250g (<500g) and 2.5kg (entirely out of stock) excluded.
        // 900g (Vanila + Cokoladni Brownie) and 5kg (Moka) remain.
        assertEquals(2, variants.size());

        Product v0 = variants.get(0);
        assertEquals("Impact Whey Protein", v0.getName());
        assertEquals("900g", v0.getPackage_weight().get(0));
        assertEquals(900.0, v0.getPrimaryWeightGrams());
        assertEquals("6299", v0.getPrice());
        assertEquals(stub.getUrl() + "?pakovanje=900g", v0.getUrl());
        assertTrue(v0.getFlavours().contains("Vanila"));
        assertTrue(v0.getFlavours().contains("Čokoladni Brownie"));
        assertEquals("https://static.thcdn.com/productimg/original/10530943-2095330628111294.png", v0.getImageUrl());

        Product v1 = variants.get(1);
        assertEquals("5kg", v1.getPackage_weight().get(0));
        assertEquals(5000.0, v1.getPrimaryWeightGrams());
        assertEquals("23599", v1.getPrice());
        assertEquals(stub.getUrl() + "?pakovanje=5kg", v1.getUrl());
        assertTrue(v1.getFlavours().contains("Moka"));
    }

    @Test
    void expandByVariants_excludesSiblingFormatFlavours() throws Exception {
        File file = new File("src/test/resources/myprotein/sibling_format_masterdata.json");
        JsonNode masterData = objectMapper.readTree(file);

        Product stub = new Product();
        stub.setUrl("https://www.myprotein.rs/p/sports-nutrition/impact-whey-protein/10530943/");
        stub.setName("Impact Whey Protein");

        List<Product> variants = scraper.expandByVariants(masterData, stub);

        // "Cookie Crumble (Milkshake)" and "Chocolate (+Collagen)" belong to sibling
        // product formats bundled on the same page and must be excluded entirely —
        // both from the flavour list and from price/weight grouping.
        assertEquals(1, variants.size());

        Product v0 = variants.get(0);
        assertEquals("900g", v0.getPackage_weight().get(0));
        assertEquals(900.0, v0.getPrimaryWeightGrams());
        assertEquals(List.of("Vanila", "Bez Arome"), v0.getFlavours());
    }

    @Test
    void expandByVariants_mergesPriceGroupsThatShareAWeightLabel() throws Exception {
        File file = new File("src/test/resources/myprotein/duplicate_weight_masterdata.json");
        JsonNode masterData = objectMapper.readTree(file);

        Product stub = new Product();
        stub.setUrl("https://www.myprotein.rs/p/sports-nutrition/veganska-proteinska-mesavina/11776868/");
        stub.setName("Veganska proteinska mešavina");

        List<Product> variants = scraper.expandByVariants(masterData, stub);

        // Three separate 2.5kg price groups (8400/8599/9270, one per flavour) all
        // round to the same "2500g" weight label and must collapse into a single
        // variant — otherwise they'd all share the same URL and overwrite each
        // other's price within the same scrape, spamming price history.
        assertEquals(2, variants.size());

        Product kg1 = variants.stream().filter(v -> v.getPackage_weight().get(0).equals("1kg")).findFirst().orElseThrow();
        assertEquals("4200", kg1.getPrice());

        Product kg25 = variants.stream().filter(v -> v.getPackage_weight().get(0).equals("2500g")).findFirst().orElseThrow();
        assertEquals("8400", kg25.getPrice());
        assertEquals(List.of("Vanila", "Čokolada", "Bez Arome"), kg25.getFlavours());
        assertEquals(stub.getUrl() + "?pakovanje=2500g", kg25.getUrl());
    }

    @Test
    void scrape_rebasesVariantUrlsWhenDetailPageRedirectsToAnotherProduct() throws Exception {
        String listingHtml = "<html><body>" +
                "<product-card-wrapper data-sku=\"11272855\">" +
                "<a data-name=\"image-anchor\" href=\"/p/sports-nutrition/organski-whey-protein/11272855/\" data-primary-src=\"img.png\">" +
                "<div class=\"product-item-title\">Organski Whey Protein</div>" +
                "</a>" +
                "</product-card-wrapper>" +
                "</body></html>";
        Document listingDoc = Jsoup.parse(listingHtml);

        File file = new File("src/test/resources/myprotein/impact_whey_masterdata.json");
        JsonNode masterData = objectMapper.readTree(file);
        String detailHtml = "<html><body><script>const masterData = " + masterData.toString() + ";</script></body></html>";

        // MyProtein discontinued the "Organski Whey Protein" SKU and now 301-redirects
        // its detail page to "Impact Whey Protein" — Jsoup.Document.location() reflects
        // the final, post-redirect URL.
        String redirectedUrl = "https://www.myprotein.rs/p/sports-nutrition/impact-whey-protein/10530943/";
        Document detailDoc = Jsoup.parse(detailHtml, redirectedUrl);

        Connection conn = mock(Connection.class);
        when(httpClient.connection(anyString())).thenReturn(conn);
        when(conn.get()).thenReturn(detailDoc);

        List<Product> result = scraper.scrape(null, listingDoc);

        assertFalse(result.isEmpty());
        for (Product p : result) {
            assertTrue(p.getUrl().startsWith(redirectedUrl),
                    "Expected variant URL rebased onto redirected canonical URL but was: " + p.getUrl());
        }
    }

    @Test
    void extractNutritionFromTable_parsesPer100gColumnWithNonHeaderFirstRow() throws Exception {
        File file = new File("src/test/resources/myprotein/impact_whey_masterdata.json");
        JsonNode masterData = objectMapper.readTree(file);

        Product p = new Product();
        scraper.extractNutritionFromTable(masterData, p);

        // nutritionalInfo table: "U 100 g" column — Proteini 72g, Masti 5.9g, od kojih šećeri 5.1g, 379 kcal
        assertEquals(72.0, p.getProteinPer100g());
        assertEquals(5.9, p.getFatPer100g());
        assertEquals(5.1, p.getSugarPer100g());
        assertEquals(379.0, p.getCaloriePer100g());
    }

    @Test
    void extractNutritionFromTable_parsesSugarFromIndentedSubRow() throws Exception {
        File file = new File("src/test/resources/myprotein/vegan_blend_masterdata.json");
        JsonNode masterData = objectMapper.readTree(file);

        Product p = new Product();
        scraper.extractNutritionFromTable(masterData, p);

        // "od kojih šećeri" is in a sub-row with a leading empty cell, shifting
        // the label and value columns one to the right of the header row.
        assertEquals(75.0, p.getProteinPer100g());
        assertEquals(1.1, p.getFatPer100g());
        assertEquals(1.5, p.getSugarPer100g());
        assertEquals(353.0, p.getCaloriePer100g());
    }
}
