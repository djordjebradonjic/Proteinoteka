package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import com.proteinoteka.service.producttype.CreatineProfile;
import com.proteinoteka.service.producttype.ProductTypes;
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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

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

    // ---------------------------------------------------------------- creatine as a second listing

    @Test
    void listingTargets_walkProteinThenCreatineOfTheSameStore() {
        List<ListingTarget> targets = scraper.listingTargets();
        assertEquals(List.of("protein", "creatine"), targets.stream().map(ListingTarget::productType).toList());

        ListingTarget.HtmlPaged protein = (ListingTarget.HtmlPaged) targets.get(0).source();
        assertEquals("https://gymbeam.rs/proteini", protein.pageUrl().apply(0));
        assertEquals("https://gymbeam.rs/proteini?p=2", protein.pageUrl().apply(1));

        ListingTarget.HtmlPaged creatine = (ListingTarget.HtmlPaged) targets.get(1).source();
        assertEquals("https://gymbeam.rs/kreatin", creatine.pageUrl().apply(0));
        assertEquals("https://gymbeam.rs/kreatin?p=3", creatine.pageUrl().apply(2));
        assertTrue(targets.get(1).categoryTrusted());
    }

    @Test
    void listingTargets_croatianStoreHasItsOwnCreatineListing() {
        GymBeamHrScraper hr = new GymBeamHrScraper(nutritionParser, baseEnricher, httpClient);
        ListingTarget.HtmlPaged creatine = (ListingTarget.HtmlPaged) hr.listingTargets().get(1).source();
        assertEquals(ProductTypes.CREATINE, hr.listingTargets().get(1).productType());
        assertEquals("https://gymbeam.hr/kreatin", creatine.pageUrl().apply(0));
        assertEquals("https://gymbeam.hr/kreatin?p=2", creatine.pageUrl().apply(1));
    }

    @Test
    void expandByPackageWeight_keepsSmallTubsForCreatineThatTheProteinFloorDrops() throws Exception {
        JsonNode productData = objectMapper.readTree(new File("src/test/resources/gymbeam/gold_standard_productdata.json"));
        Product stub = new Product();
        stub.setUrl("https://gymbeam.rs/290-100-whey-gold-standard-protein-optimum-nutrition.html");
        stub.setName("100% Whey Gold Standard - Optimum Nutrition");

        List<Product> asProtein = scraper.expandByPackageWeight(productData, stub, ProductTypes.PROTEIN);
        List<Product> asCreatine = scraper.expandByPackageWeight(productData, stub, ProductTypes.CREATINE);

        // the fixture has an in-stock 450g pack: below the 500g protein floor, above the 60g creatine one
        assertTrue(asProtein.stream().noneMatch(v -> Double.valueOf(450.0).equals(v.getPrimaryWeightGrams())));
        Product small = asCreatine.stream()
                .filter(v -> Double.valueOf(450.0).equals(v.getPrimaryWeightGrams()))
                .findFirst().orElseThrow();
        assertEquals(ProductTypes.CREATINE, small.getProductType());
        assertTrue(asProtein.stream().allMatch(v -> ProductTypes.PROTEIN.equals(v.getProductType())));
    }

    // A listing where every title is rejected must not open a single detail page (a browser
    // navigation, so proxy traffic on some stores): the page is null, so any attempt would fail loudly.
    @Test
    void scrape_creatineTargetRejectsOtherFamiliesOnTheListingTitle() {
        Document listing = Jsoup.parse("""
                <div data-test="cp-products">
                  <a id="product_item_1" title="PhD Pre-Workout Burn 300g" href="https://gymbeam.rs/phd-burn"></a>
                  <a id="product_item_2" title="Back to Gym XXL paket" href="https://gymbeam.rs/paket"></a>
                </div>""");

        List<Product> result = scraper.scrape(scraper.listingTargets().get(1), new CreatineProfile(),
                null, listing, Set.of());

        assertTrue(result.isEmpty());
    }

    @Test
    void scrape_proteinPathStillSkipsNonProteinTitlesWithoutOpeningThem() {
        when(baseEnricher.isNonProteinProduct("Creatine Monohydrate 500g")).thenReturn(true);
        Document listing = Jsoup.parse("""
                <div data-test="cp-products">
                  <a id="product_item_1" title="Creatine Monohydrate 500g" href="https://gymbeam.rs/creatine"></a>
                </div>""");

        assertTrue(scraper.scrape(null, listing, Set.of()).isEmpty());
    }
}
