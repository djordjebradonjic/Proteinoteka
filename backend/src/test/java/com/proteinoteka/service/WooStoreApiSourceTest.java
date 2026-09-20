package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.service.producttype.CreatineProfile;
import org.jsoup.Connection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.OngoingStubbing;

import java.io.File;
import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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

    // Real Proteinbox titles state servings, not grams ("Crea Pro – Basic Supplements / 200 porcija"), while
    // the product's own URL carries the pack ("…-1000gr-…"): 14 of its 30 creatine powders had no weight.
    private List<Product> mapSimple(String name, String permalink) throws IOException {
        JsonNode parent = JSON.readTree("{\"id\":1,\"type\":\"simple\",\"name\":\"" + name + "\",\"permalink\":\""
                + permalink + "\",\"is_in_stock\":true,\"prices\":{\"price\":\"505000\",\"currency_minor_unit\":2},"
                + "\"attributes\":[],\"brands\":[]}");
        return source.mapProduct(parent, List.of(), false);
    }

    @Test
    void aSimpleProductWithNoWeightInItsTitleTakesItFromItsUrl() throws IOException {
        Product p = mapSimple("Crea Pro – Basic Supplements / 200 porcija",
                "https://proteinbox.rs/p/crea-pro-1000gr-kreatin-basic-supplements/").get(0);

        assertEquals(1000.0, p.getPrimaryWeightGrams());
        assertEquals(List.of("1kg"), p.getPackage_weight());

        assertEquals(225.0, mapSimple("Kre-Alkalyn OneRaw® – Zoomad Labs, 75 porcija",
                "https://proteinbox.rs/p/oneraw-kre-alkalyn-creatine-225-g/").get(0).getPrimaryWeightGrams());
        assertEquals(400.0, mapSimple("Creatine Monohydrate – Genius Nutrition, 133 porcije",
                "https://proteinbox.rs/p/kreatin-monohidrat-400gr-genius-nutriton/").get(0).getPrimaryWeightGrams());
    }

    @Test
    void anUrlWithoutAWeightOrWithAStatedTitleWeightIsLeftAlone() throws IOException {
        assertNull(mapSimple("Creatine Powder Micronized – Optimum Nutrition / 88 porcija",
                "https://proteinbox.rs/p/optimum-nutrition-creatine-powder-micronized/").get(0).getPrimaryWeightGrams());
        // the title wins over a different figure in the URL
        assertEquals(300.0, mapSimple("Domaći kreatin 300g", "https://proteinbox.rs/p/domaci-kreatin-500g/")
                .get(0).getPrimaryWeightGrams());
        // a milligram dose in the URL is not a pack weight
        assertNull(mapSimple("Creatine Caps", "https://proteinbox.rs/p/creatine-3000mg-caps/").get(0).getPrimaryWeightGrams());
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

    // ------------------------------------------------------------ Croatian stores (EUR), captured 2026-09-19

    @Test
    void aSizeStatedOnceForTheWholeProductGivesTheWeightWhenVariationsOnlyDifferByFlavour() throws IOException {
        // proteini-outlet.com: "Pakiranje: 500g" is a plain attribute, the variations are flavours only.
        // Before this fallback none of its products had a weight.
        List<Product> rows = mapAll("proteinoutlet_kreatin_products.json", "proteinoutlet_kreatin_variations.json", true);

        Product animal = byName(rows, "Animal Creatine");
        assertEquals(500.0, animal.getPrimaryWeightGrams());
        assertEquals("Universal-Animal", animal.getBrand(), "brand comes from the 'Brandovi' attribute");
        assertEquals("45", animal.getPrice());
        assertEquals(300.0, byName(rows, "CreaVolution").getPrimaryWeightGrams());
        assertEquals(400.0, byName(rows, "Platinum Creatine").getPrimaryWeightGrams(), "'400 g' with a space");
        assertEquals("18.7", byName(rows, "Platinum Creatine").getPrice(), "EUR keeps its cents");
    }

    @Test
    void aCountAsThePackSizeIsKeptForTheTypeParserInsteadOfBecomingAWeight() throws IOException {
        List<Product> rows = mapAll("proteinoutlet_kreatin_products.json", "proteinoutlet_kreatin_variations.json", true);

        Product tablets = byName(rows, "Creapure");
        assertNull(tablets.getPrimaryWeightGrams(), "'60 tableta za žvakanje' is a count, not grams");
        creatine.sanitize(tablets, "Proteini Outlet");
        assertEquals(60, tablets.getUnitCount());
        assertEquals("tablet", tablets.getProductForm());

        Product capsules = byName(rows, "kapsule");
        creatine.sanitize(capsules, "Proteini Outlet");
        assertEquals(220, capsules.getUnitCount());
        assertEquals("capsule", capsules.getProductForm());
    }

    @Test
    void aWeightRightAfterACommaIsReadFromTheTitleWhenTheStoreHasNoBrandOrSizeFields() throws IOException {
        // nutrition-shop.hr: no brand field, no size attribute, "MONOHYDRATE,300g" without a space
        List<Product> rows = mapAll("nutritionshophr_kreatin_products.json", null, true);

        assertEquals(250.0, byName(rows, "OLIMP CREATINE").getPrimaryWeightGrams());
        assertEquals("21.2", byName(rows, "OLIMP CREATINE").getPrice());
        assertEquals(300.0, byName(rows, "DORIAN YATES").getPrimaryWeightGrams());
        assertEquals(300.0, byName(rows, "NUTREND CREATINE").getPrimaryWeightGrams());
        Product tablets = byName(rows, "KREA7");
        assertNull(tablets.getPrimaryWeightGrams());
        creatine.sanitize(tablets, "Nutrition Shop HR");
        assertEquals(90, tablets.getUnitCount(), "the count comes from the title when there is no size label");
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

    // ------------------------------------------------------------ transport: retry a hiccup, never a block

    private static final ListingTarget.WooStoreApi CATEGORY = new ListingTarget.WooStoreApi("https://shop.test", "kreatin");

    /** A source whose every request is answered by {@code connection}; retries wait 0 ms. */
    private static WooStoreApiSource sourceAnsweredBy(Connection connection) {
        ProxyAwareHttpClient http = mock(ProxyAwareHttpClient.class);
        when(http.connection(anyString(), anyBoolean())).thenReturn(connection);
        WooStoreApiSource s = new WooStoreApiSource(http, JSON, mock(BrandNormalizerService.class));
        s.retryDelayMs = 0;
        return s;
    }

    /** A fluent Connection that, on successive execute() calls, throws or returns the given outcomes in order. */
    private static Connection connectionGiving(Object... outcomes) throws IOException {
        Connection conn = mock(Connection.class, RETURNS_SELF);
        OngoingStubbing<Connection.Response> stub = when(conn.execute());
        for (Object outcome : outcomes) {
            stub = outcome instanceof Throwable t ? stub.thenThrow(t) : stub.thenReturn((Connection.Response) outcome);
        }
        return conn;
    }

    private static Connection.Response answer(int status, String contentType, String body) {
        Connection.Response r = mock(Connection.Response.class);
        when(r.statusCode()).thenReturn(status);
        when(r.contentType()).thenReturn(contentType);
        when(r.body()).thenReturn(body);
        return r;
    }

    private static Store aStore() {
        Store store = new Store();
        store.setName("Test store");
        store.setCurrency("RSD");
        return store;
    }

    @Test
    void aTimedOutRequestIsRetriedOnce() throws IOException {
        Connection conn = connectionGiving(new SocketTimeoutException("Read timed out"),
                answer(200, "application/json", "[]"));

        List<Product> rows = sourceAnsweredBy(conn).fetch(CATEGORY, aStore(), false, null);

        assertTrue(rows.isEmpty());
        verify(conn, times(2)).execute();
    }

    @Test
    void twoTimeoutsInARowFailTheTarget() throws IOException {
        Connection conn = connectionGiving(new SocketTimeoutException("Read timed out"),
                new SocketTimeoutException("Read timed out"));

        assertThrows(SocketTimeoutException.class, () -> sourceAnsweredBy(conn).fetch(CATEGORY, aStore(), false, null));
        verify(conn, times(2)).execute();
    }

    @Test
    void anHttpErrorOrABotChallengeIsAnAnswerAndIsNeverRepeated() throws IOException {
        Connection blocked = connectionGiving(answer(403, "text/html", "Forbidden"));
        assertThrows(IOException.class, () -> sourceAnsweredBy(blocked).fetch(CATEGORY, aStore(), false, null));
        verify(blocked, times(1)).execute();

        Connection challenge = connectionGiving(answer(200, "text/html", "<html>Just a moment...</html>"));
        assertThrows(IOException.class, () -> sourceAnsweredBy(challenge).fetch(CATEGORY, aStore(), false, null));
        verify(challenge, times(1)).execute();
    }
}
