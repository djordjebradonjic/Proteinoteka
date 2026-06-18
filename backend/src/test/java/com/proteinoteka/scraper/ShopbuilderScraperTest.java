package com.proteinoteka.scraper;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.BaseScraperEnricher;
import com.proteinoteka.service.NutritionParserService;
import com.proteinoteka.service.ShopbuilderScraper;
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
public class ShopbuilderScraperTest {

    @Mock private NutritionParserService nutritionParser;
    @Mock private BaseScraperEnricher    baseEnricher;

    private ShopbuilderScraper scraper;
    private Document listingDoc;
    private Document detailDoc;

    @BeforeEach
    void setUp() throws IOException {
        scraper    = new ShopbuilderScraper(nutritionParser, baseEnricher);
        listingDoc = Jsoup.parse(new File("src/test/resources/html/shopbuilder_listing.html"), StandardCharsets.UTF_8.name());
        detailDoc  = Jsoup.parse(new File("src/test/resources/html/shopbuilder_detail.html"),  StandardCharsets.UTF_8.name());
    }

    // ── Listing page ──────────────────────────────────────────────────────────────

    @Test
    void shouldParseProductsFromListing() {
        List<Product> products = scraper.scrape(null, listingDoc);

        assertFalse(products.isEmpty(), "Mora pronaći proizvode");
        System.out.println("Pronađeno " + products.size() + " proizvoda na listing strani");
        assertTrue(products.size() >= 8, "Treba bar 8 proizvoda u test HTML-u");
    }

    @Test
    void shouldExtractNameBrandAndUrl() {
        List<Product> products = scraper.scrape(null, listingDoc);

        for (Product p : products) {
            assertNotNull(p.getName(),  "Ime ne sme biti null");
            assertFalse(p.getName().isBlank(), "Ime ne sme biti prazno");
            assertNotNull(p.getUrl(),   "URL ne sme biti null: " + p.getName());
            assertTrue(p.getUrl().contains("shopbuilder.rs"), "URL mora sadržati domain: " + p.getUrl());
            assertNotNull(p.getBrand(), "Brend ne sme biti null: " + p.getName());
        }
    }

    @Test
    void shouldExtractPriceAsPlainNumber() {
        List<Product> products = scraper.scrape(null, listingDoc);

        long withPrice = products.stream().filter(p -> p.getPrice() != null && !p.getPrice().isBlank()).count();
        System.out.println("Proizvoda sa cenom: " + withPrice + " od " + products.size());
        assertTrue(withPrice >= products.size() * 0.9, "Više od 90% mora imati cenu");

        products.stream()
                .filter(p -> p.getPrice() != null)
                .forEach(p -> {
                    assertFalse(p.getPrice().contains("din"), "Cena ne sme sadržati 'din': " + p.getPrice());
                    assertDoesNotThrow(() -> Double.parseDouble(p.getPrice()),
                            "Cena mora biti parsabilna: " + p.getPrice());
                    assertTrue(Double.parseDouble(p.getPrice()) > 1000,
                            "Cena mora biti > 1000 RSD: " + p.getPrice());
                });
    }

    @Test
    void shouldExtractWeightFromName() {
        List<Product> products = scraper.scrape(null, listingDoc);

        long withWeight = products.stream().filter(p -> p.getPrimaryWeightGrams() != null).count();
        System.out.println("Proizvoda sa težinom: " + withWeight + " od " + products.size());
        assertTrue(withWeight >= products.size() * 0.8, "Više od 80% mora imati težinu");

        products.stream()
                .filter(p -> p.getPrimaryWeightGrams() != null)
                .limit(5)
                .forEach(p -> System.out.printf("  '%s' → %.0fg%n", p.getName(), p.getPrimaryWeightGrams()));

        products.stream()
                .filter(p -> p.getPrimaryWeightGrams() != null)
                .forEach(p -> assertTrue(p.getPrimaryWeightGrams() >= 400,
                        "Težina mora biti >= 400g: " + p.getName() + " → " + p.getPrimaryWeightGrams()));
    }

    @Test
    void shouldUpgradeImageToFullResolution() {
        List<Product> products = scraper.scrape(null, listingDoc);

        long withImage = products.stream().filter(p -> p.getImageUrl() != null).count();
        assertTrue(withImage >= products.size() * 0.9, "Više od 90% mora imati sliku");

        products.stream()
                .filter(p -> p.getImageUrl() != null)
                .forEach(p -> {
                    assertTrue(p.getImageUrl().startsWith("https://shopbuilder.rs"),
                            "Slika mora biti apsolutni URL: " + p.getImageUrl());
                    assertFalse(p.getImageUrl().contains("_200x200"),
                            "Slika ne sme biti 200x200 thumbnail: " + p.getImageUrl());
                });
    }

    @Test
    void shouldReturnFalseForHasNextPage() {
        // shopbuilder.rs loads all products via "Učitaj više" — no URL-based pagination
        assertFalse(scraper.hasNextPage(listingDoc), "hasNextPage mora biti false — nema paginacije");
    }

    @Test
    void shouldBuildCorrectListingUrl() {
        assertEquals("https://shopbuilder.rs/proteini-c43", scraper.buildPageUrl(0));
        assertEquals("https://shopbuilder.rs/proteini-c43", scraper.buildPageUrl(1));
    }

    // ── Detail page ───────────────────────────────────────────────────────────────

    @Test
    void shouldExtractNutritionFromDetail() {
        Product p = new Product();
        p.setName("100% Whey Protein Gold Standard");

        scraper.extractNutrition(detailDoc, p);

        assertNotNull(p.getProteinPer100g(), "Protein ne sme biti null");
        assertEquals(74.0, p.getProteinPer100g(), 0.1, "Protein: 74g/100g");

        assertNotNull(p.getFatPer100g(), "Mast ne sme biti null");
        assertEquals(4.2, p.getFatPer100g(), 0.1, "Mast: 4.2g/100g");

        assertNotNull(p.getSugarPer100g(), "Šećer ne sme biti null");
        assertEquals(3.7, p.getSugarPer100g(), 0.1, "Šećer: 3.7g/100g");

        assertNotNull(p.getCaloriePer100g(), "Kalorije ne smeju biti null");
        assertEquals(373.0, p.getCaloriePer100g(), 1.0, "Kalorije: ~373 kcal/100g");

        System.out.printf("Nutritivne vrednosti: protein=%.1fg, mast=%.1fg, šećer=%.1fg, kalorije=%.0fkcal%n",
                p.getProteinPer100g(), p.getFatPer100g(), p.getSugarPer100g(), p.getCaloriePer100g());
    }

    @Test
    void shouldExtractFlavoursFromDetail() {
        org.jsoup.select.Elements options = detailDoc.select("select.custom-select-field option");
        List<String> flavours = new java.util.ArrayList<>();
        options.forEach(opt -> flavours.add(opt.text().trim()));

        assertFalse(flavours.isEmpty(), "Mora imati ukuse");
        assertTrue(flavours.size() >= 5, "Mora imati bar 5 ukusa");
        assertTrue(flavours.contains("jagoda"), "Mora sadržati 'jagoda'");
        System.out.println("Ukusi: " + flavours);
    }

    @Test
    void shouldExtractDescriptionFromDetail() {
        org.jsoup.nodes.Element descEl = detailDoc.selectFirst("div.description.bottom-text-block");
        assertNotNull(descEl, "Description element mora postojati");
        String text = descEl.text().trim();
        assertFalse(text.isBlank(), "Opis ne sme biti prazan");
        assertTrue(text.toLowerCase().contains("whey protein"), "Opis mora sadržati 'whey protein'");
    }

    @Test
    void printFirstFiveProductsForManualInspection() {
        List<Product> products = scraper.scrape(null, listingDoc);
        System.out.println("\n=== Prvih 5 proizvoda sa Shopbuilder listing ===");
        products.stream().limit(5).forEach(p ->
                System.out.printf("  Brend: %-20s Ime: %-50s Cena: %-12s Težina: %-8s%n",
                        p.getBrand(),
                        p.getName(),
                        p.getPrice(),
                        p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) + "g" : "?")
        );
    }
}
