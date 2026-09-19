package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import com.proteinoteka.service.producttype.CreatineProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Fixtures under src/test/resources/woo are real Store API responses (trimmed), captured 2026-09-19 from
 * the creatine category of proteinbox.rs, proteinisi.rs and supplementshop.rs.
 */
class WooStoreApiSourceTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private WooStoreApiSource source;
    private final CreatineProfile creatine = new CreatineProfile();

    @BeforeEach
    void setUp() {
        BrandNormalizerService brands = mock(BrandNormalizerService.class);
        when(brands.findKnownBrandIn(anyString())).thenReturn(Optional.empty());
        source = new WooStoreApiSource(null, JSON, brands);
    }

    private static JsonNode read(String file) throws IOException {
        return JSON.readTree(new File("src/test/resources/woo/" + file));
    }

    private List<Product> mapAll(String productsFile, String variationsFile, boolean eur) throws IOException {
        Map<Long, List<JsonNode>> byParent = new LinkedHashMap<>();
        if (variationsFile != null) {
            for (JsonNode v : read(variationsFile)) {
                byParent.computeIfAbsent(v.path("parent").asLong(), k -> new ArrayList<>()).add(v);
            }
        }
        List<Product> rows = new ArrayList<>();
        for (JsonNode parent : read(productsFile)) {
            rows.addAll(source.mapProduct(parent, byParent.getOrDefault(parent.path("id").asLong(), List.of()), eur));
        }
        return rows;
    }

    private static Product byName(List<Product> rows, String fragment) {
        return rows.stream().filter(p -> p.getName().contains(fragment)).findFirst()
                .orElseThrow(() -> new AssertionError("no row named like '" + fragment + "' in "
                        + rows.stream().map(Product::getName).toList()));
    }

    @Test
    void simpleProductKeepsWeightAndPriceInWholeDinars() throws IOException {
        Product p = byName(mapAll("proteinbox_kreatin_products.json", "proteinbox_kreatin_variations.json", false),
                "Domaći kreatin");

        assertEquals("https://proteinbox.rs/p/domaci-kreatin-300g/", p.getUrl());
        assertEquals("2290", p.getPrice());
        assertEquals(300.0, p.getPrimaryWeightGrams());
        assertEquals(List.of("300g"), p.getPackage_weight());
        assertNull(p.getVariantLabel());
    }

    @Test
    void htmlEntitiesInTheTitleAreDecodedAndTheBrandIsReadFromTheTitleShape() throws IOException {
        List<Product> rows = mapAll("proteinbox_kreatin_products.json", "proteinbox_kreatin_variations.json", false);

        Product kre = byName(rows, "Kre-Alkalyn OneRaw");
        assertTrue(kre.getName().contains("–"), "&#8211; must be decoded: " + kre.getName());
        assertEquals("Zoomad Labs", kre.getBrand());

        Product nutriversum = byName(rows, "Creatine Monohydrate Basic");
        assertEquals("Nutriversum", nutriversum.getBrand());
    }

    @Test
    void outOfStockItemsAreDropped() throws IOException {
        List<Product> rows = mapAll("proteinbox_kreatin_products.json", "proteinbox_kreatin_variations.json", false);
        assertTrue(rows.stream().noneMatch(p -> p.getName().contains("Creapure")),
                "Extrifit Creapure is out of stock in the fixture");
    }

    @Test
    void sizeVariantsBecomeOneRowPerSizeWithTheSizeInTheUrl() throws IOException {
        List<Product> rows = mapAll("proteinbox_kreatin_products.json", "proteinbox_kreatin_variations.json", false);

        // in the fixture the 500g variant is out of stock, so only 300g remains
        List<Product> nutriversum = rows.stream().filter(p -> p.getName().contains("Creatine Monohydrate Basic")).toList();
        assertEquals(1, nutriversum.size());
        Product p = nutriversum.get(0);
        assertEquals("https://proteinbox.rs/p/creatine-monohydrate-basic/?attribute_pa_pakovanje=300g", p.getUrl());
        assertEquals("2400", p.getPrice());
        assertEquals(300.0, p.getPrimaryWeightGrams());
        assertEquals("300g", p.getVariantLabel());
    }

    @Test
    void flavourOnlyVariantsCollapseIntoOneRowAtTheProductUrl() throws IOException {
        List<Product> rows = mapAll("proteinbox_kreatin_products.json", "proteinbox_kreatin_variations.json", false)
                .stream().filter(p -> p.getName().contains("CreGAAtine")).toList();

        assertEquals(1, rows.size(), "two flavours, same size → one row");
        Product p = rows.get(0);
        assertEquals("https://proteinbox.rs/p/cregaatine/", p.getUrl(), "a flavour must never end up in the URL");
        assertEquals("2990", p.getPrice());
        assertTrue(p.getFlavours().containsAll(List.of("Narandža", "Standard")));
    }

    @Test
    void brandComesFromTheApiWhenTheStoreFillsIt() throws IOException {
        List<Product> rows = mapAll("proteinisi_kreatin_products.json", null, false);
        assertFalse(rows.isEmpty());
        assertTrue(rows.stream().allMatch(p -> p.getBrand() != null && !p.getBrand().isBlank()),
                "proteinisi.rs sets brands[] on every product: " + rows.stream().map(Product::getBrand).toList());
    }

    @Test
    void mapperOutputRunsThroughTheCreatineProfile() throws IOException {
        List<Product> rows = mapAll("proteinbox_kreatin_products.json", "proteinbox_kreatin_variations.json", false);

        Product beta = byName(rows, "Beta-K");
        assertTrue(creatine.rejectReason(beta, true).isEmpty());
        creatine.sanitize(beta, "Proteinbox");
        assertEquals("capsule", beta.getProductForm());
        assertEquals(50, beta.getServingsPerContainer());
        assertEquals(200, beta.getUnitCount());

        Product kre = byName(rows, "Kre-Alkalyn OneRaw");
        creatine.sanitize(kre, "Proteinbox");
        assertEquals("buffered", kre.getCreatineType());
        assertEquals(75, kre.getServingsPerContainer());

        Product nutriversum = byName(rows, "Creatine Monohydrate Basic");
        creatine.sanitize(nutriversum, "Proteinbox");
        assertEquals("powder", nutriversum.getProductForm());
        assertEquals("monohydrate", nutriversum.getCreatineType());
        assertEquals(60, nutriversum.getServingsPerContainer(),
                "300g variant: the description lists 60 AND 100 servings, so it comes from 300 g ÷ 5 g");
    }

    @Test
    void noiseInsideACategoryIsRejectedByTheProfileNotTheMapper() throws IOException {
        List<Product> rows = mapAll("supplementshop_kreatin_products.json", null, false);

        // "PhD Pre-Workout Burn" is out of stock in the fixture, so the mapper already drops it; the
        // bundle is in stock and must be caught by the profile.
        assertTrue(rows.stream().noneMatch(p -> p.getName().contains("Pre-Workout")));
        assertTrue(creatine.rejectReason(byName(rows, "XXL paket"), true).isPresent());
        assertTrue(creatine.rejectReason(byName(rows, "PhD Creatine"), true).isEmpty());
    }

    @Test
    void priceUnits() {
        assertEquals(2450.0, WooStoreApiSource.minorUnitPrice(prices("245000", 2)));
        assertEquals("24", WooStoreApiSource.formatPrice(24.0, true));
        assertEquals("24.5", WooStoreApiSource.formatPrice(24.5, true));
        assertEquals("2990", WooStoreApiSource.formatPrice(2990.4, false));
        assertEquals(Double.MAX_VALUE, WooStoreApiSource.minorUnitPrice(prices("", 2)));
    }

    private static JsonNode prices(String price, int minorUnit) {
        return JSON.createObjectNode().put("price", price).put("currency_minor_unit", minorUnit);
    }
}
