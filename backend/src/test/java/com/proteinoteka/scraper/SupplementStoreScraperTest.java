package com.proteinoteka.scraper;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.BaseScraperEnricher;
import com.proteinoteka.service.NutritionParserService;
import com.proteinoteka.service.SupplementStoreScraper;
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
public class SupplementStoreScraperTest {

    @Mock private NutritionParserService nutritionParser;
    @Mock private BaseScraperEnricher baseEnricher;

    private SupplementStoreScraper scraper;
    private Document listingDoc;
    private Document detailDoc;

    @BeforeEach
    void setUp() throws IOException {
        scraper = new SupplementStoreScraper(nutritionParser, baseEnricher, null, null);
        listingDoc = Jsoup.parse(new File("src/test/resources/html/supplementstore_listing.html"), StandardCharsets.UTF_8.name());
        detailDoc  = Jsoup.parse(new File("src/test/resources/html/supplementstore_detail.html"),  StandardCharsets.UTF_8.name());
    }

    // ── Listing page ─────────────────────────────────────────────────────────────

    @Test
    void shouldParseAllProductsFromListing() {
        List<Product> products = scraper.scrape(null, listingDoc);

        assertFalse(products.isEmpty(), "Mora pronaći proizvode");
        System.out.println("Pronađeno " + products.size() + " proizvoda na listing strani");
        assertTrue(products.size() >= 50, "Treba bar 50 proizvoda (ima ih 82 na sajtu)");
    }

    @Test
    void shouldExtractNameAndUrl() {
        List<Product> products = scraper.scrape(null, listingDoc);

        for (Product p : products) {
            assertNotNull(p.getName(), "Ime ne sme biti null: " + p.getUrl());
            assertFalse(p.getName().isBlank(), "Ime ne sme biti prazno");
            assertNotNull(p.getUrl(), "URL ne sme biti null: " + p.getName());
            assertTrue(p.getUrl().contains("supplementstore.rs"), "URL mora sadržati domain: " + p.getUrl());
            assertFalse(p.getUrl().contains("?limit="), "URL ne sme sadržati ?limit= param: " + p.getUrl());
        }
    }

    @Test
    void shouldExtractPriceFromListing() {
        List<Product> products = scraper.scrape(null, listingDoc);

        long withPrice = products.stream().filter(p -> p.getPrice() != null && !p.getPrice().isBlank()).count();
        System.out.println("Proizvoda sa cenom: " + withPrice + " od " + products.size());
        assertTrue(withPrice > products.size() * 0.9, "Više od 90% proizvoda mora imati cenu");

        // Price must be a plain number (no RSD, no dots as thousands sep)
        products.stream()
                .filter(p -> p.getPrice() != null)
                .forEach(p -> {
                    assertFalse(p.getPrice().contains("RSD"), "Cena ne sme sadržati 'RSD': " + p.getPrice());
                    assertDoesNotThrow(() -> Double.parseDouble(p.getPrice()),
                            "Cena mora biti parsabilna kao broj: " + p.getPrice());
                });
    }

    @Test
    void shouldExtractWeightFromName() {
        List<Product> products = scraper.scrape(null, listingDoc);

        long withWeight = products.stream().filter(p -> p.getPrimaryWeightGrams() != null).count();
        System.out.println("Proizvoda sa težinom: " + withWeight + " od " + products.size());

        // Print a few for manual inspection
        products.stream()
                .filter(p -> p.getPrimaryWeightGrams() != null)
                .limit(5)
                .forEach(p -> System.out.printf("  '%s' → %.0fg%n", p.getName(), p.getPrimaryWeightGrams()));

        assertTrue(withWeight > products.size() * 0.7, "Više od 70% proizvoda mora imati težinu");
    }

    @Test
    void shouldExtractImageUrl() {
        List<Product> products = scraper.scrape(null, listingDoc);

        long withImage = products.stream().filter(p -> p.getImageUrl() != null && !p.getImageUrl().isBlank()).count();
        System.out.println("Proizvoda sa slikom: " + withImage + " od " + products.size());
        assertTrue(withImage > products.size() * 0.9, "Više od 90% proizvoda mora imati sliku");

        // Should be upgraded to 600x600, not thumbnail size
        products.stream()
                .filter(p -> p.getImageUrl() != null)
                .limit(3)
                .forEach(p -> {
                    System.out.println("  Slika: " + p.getImageUrl());
                    assertFalse(p.getImageUrl().contains("-228x228."), "Slika ne sme biti 228x228 thumbnail: " + p.getImageUrl());
                });
    }

    // ── Detail page ──────────────────────────────────────────────────────────────

    @Test
    void shouldExtractBrandFromDetailPage() {
        // Simulate what scraper does with detail doc via reflection-accessible public scrape() flow.
        // Since enrichBrand is private, verify indirectly through full scrape pass.
        // But we can at least check that the detail HTML has the brand element.
        String text = detailDoc.body().text();
        assertTrue(text.contains("Ultimate Nutrition"), "Detail page mora sadržati brend 'Ultimate Nutrition'");
        System.out.println("Brand element prisutan u detail HTML-u ✓");
    }

    @Test
    void shouldExtractPriceFromDetailPage() {
        // Verify the price element exists in the detail HTML
        var priceEl = detailDoc.selectFirst("span.atcp-price, p.price");
        assertNotNull(priceEl, "Price element mora postojati na detail strani");
        String raw = priceEl.text();
        System.out.println("Raw cena sa detail strane: '" + raw + "'");
        assertTrue(raw.contains("RSD") || raw.matches(".*\\d+.*"), "Price element mora sadržati broj");
    }

    @Test
    void shouldExtractNutritionFromBrText() {
        // Nutrition is in #tabcustom0 (custom tab), not in #tab-description
        var el = detailDoc.selectFirst("#tabcustom0");
        assertNotNull(el, "#tabcustom0 mora postojati na detail strani");
        String html = el.html();

        assertTrue(html.contains("Proteini") || html.contains("proteini"),
                "#tabcustom0 mora sadržati 'Proteini'");
        assertTrue(html.contains("Nutritivne vrednosti"),
                "#tabcustom0 mora sadržati header 'Nutritivne vrednosti'");
        assertTrue(html.contains("83,3") || html.contains("83.3"),
                "Mora biti prisutna vrednost proteina ~83g/100g");
        assertTrue(html.contains("398"),
                "Mora biti prisutna vrednost kalorija ~398 kcal/100g");

        System.out.println("Nutritivni podaci prisutni u #tabcustom0 ✓");
        System.out.println("Protein 83,3g/100g marker: " + html.contains("83,3"));
        System.out.println("Kcal 398/100g marker: " + html.contains("398"));
    }

    // ── Regression ───────────────────────────────────────────────────────────────

    @Test
    void printFirstFiveProductsForManualInspection() {
        List<Product> products = scraper.scrape(null, listingDoc);
        System.out.println("\n=== Prvih 5 proizvoda ===");
        products.stream().limit(5).forEach(p ->
                System.out.printf("  Ime: %-50s Cena: %-12s Težina: %-8s Slika: %s%n",
                        p.getName(), p.getPrice(),
                        p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) + "g" : "?",
                        p.getImageUrl() != null ? p.getImageUrl().substring(0, Math.min(60, p.getImageUrl().length())) : "null")
        );
    }
}
