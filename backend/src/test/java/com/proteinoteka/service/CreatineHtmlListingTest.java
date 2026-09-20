package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import com.proteinoteka.service.producttype.CreatineProfile;
import com.proteinoteka.service.producttype.ProteinProfile;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/**
 * The HTML stores' creatine listings, fed with real markup captured from the live category pages
 * (2026-09-20; long srcset lists shortened). Nothing here touches the network: a scraper only fetches
 * detail pages for URLs that are not in {@code skipUrls}, so listing tests pass every URL as "complete".
 */
class CreatineHtmlListingTest {

    private static final ListingTarget CREATINE = ListingTarget.html("creatine", "https://x/kreatin", p -> "https://x/kreatin");
    private final CreatineProfile creatineProfile = new CreatineProfile();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static Document html(String fixture) throws IOException {
        return Jsoup.parse(new File("src/test/resources/html/" + fixture), StandardCharsets.UTF_8.name());
    }

    private static List<String> names(List<Product> products) {
        return products.stream().map(Product::getName).collect(Collectors.toList());
    }

    private static Set<String> urlsOf(List<Product> products) {
        return products.stream().map(Product::getUrl).collect(Collectors.toSet());
    }

    // ------------------------------------------------------------------ FitLab

    // A discounted card renders the old price (struck through) before the current one. FitLab rows in
    // production held the old price (Nutriversum 2 kg: stored 6.880, selling at 5.490).
    @Test
    void fitLabTakesTheCurrentPriceOfADiscountedCard() throws IOException {
        List<Product> products = new FitLabScraper(null, null, null).parseListing(html("fitlab_creatine_listing.html"));

        assertEquals(4, products.size());
        Product discounted = products.stream()
                .filter(p -> p.getName().startsWith("Creatine 3000 120cap")).findFirst().orElseThrow();
        assertEquals("1.470", discounted.getPrice(), "was 1.950 before the -25% discount");
        assertEquals("https://fitlab.rs/sr/proizvodi/creatine-3000-120cap-applied-nutrition", discounted.getUrl());

        Product plain = products.stream()
                .filter(p -> p.getName().startsWith("Creatine HCl 2400")).findFirst().orElseThrow();
        assertEquals("2.890", plain.getPrice());
    }

    @Test
    void fitLabCreatineCategoryBundlesAreRejectedButCapsulesAndSachetsKept() throws IOException {
        List<Product> products = new FitLabScraper(null, null, null).parseListing(html("fitlab_creatine_listing.html"));
        BaseScraperEnricher enricher = new BaseScraperEnricher(null);
        ListingFamily family = ListingFamily.of(CREATINE, creatineProfile);

        List<String> kept = products.stream()
                .filter(p -> family.rejectReason(p, enricher).isEmpty()).map(Product::getName).toList();

        assertEquals(3, kept.size(), kept.toString());
        assertTrue(kept.stream().noneMatch(n -> n.contains("Protein Shake")), "protein + creatine bundle");
        assertTrue(kept.stream().anyMatch(n -> n.startsWith("CREA PRO")), "sachets");
    }

    // ------------------------------------------------------------------ XSport

    // The listing title says only "AMIX KreAlkalyn"; the detail page's info block has "Pakovanje: 120 kap."
    // and "Broj serviranja: 60" (real markup of xsport.rs/proizvod/amix_krealkalyn_120cap).
    @Test
    void xSportReadsPackAndServingsFromTheDetailInfoBlock() throws IOException {
        XSportScraper scraper = new XSportScraper(null, null, null, null, new com.proteinoteka.util.WeightParser());
        Product p = new Product();
        p.setName("AMIX KreAlkalyn");

        scraper.enrichPackFromDetail(html("xsport_creatine_detail_info.html"), p);
        creatineProfile.sanitize(p, "XSport");

        assertEquals("capsule", p.getProductForm());
        assertEquals(120, p.getUnitCount());
        assertEquals(60, p.getServingsPerContainer());
        assertNull(p.getPrimaryWeightGrams(), "a capsule pack has no gram weight");
    }

    @Test
    void xSportTakesTheWeightOfAPowderFromThePackRowWhenTheTitleHasNone() {
        XSportScraper scraper = new XSportScraper(null, null, null, null, new com.proteinoteka.util.WeightParser());
        Product p = new Product();
        p.setName("SCITEC Creatine");
        Document detail = Jsoup.parse("<div class='col-md-8'><div class='row'><label>Pakovanje:</label>"
                + "<div class='col-sm-8'>300 g</div></div></div>");

        scraper.enrichPackFromDetail(detail, p);

        assertEquals(300.0, p.getPrimaryWeightGrams());
        assertEquals(List.of("300g"), p.getPackage_weight());
    }

    @Test
    void xSportKeepsAWeightThatTheTitleAlreadyStates() {
        XSportScraper scraper = new XSportScraper(null, null, null, null, new com.proteinoteka.util.WeightParser());
        Product p = new Product();
        p.setName("OSTROVIT Creatine 500g");
        p.setPrimaryWeightGrams(500.0);
        p.getPackage_weight().add("500g");
        Document detail = Jsoup.parse("<div class='col-md-8'><div class='row'><label>Pakovanje:</label>"
                + "<div class='col-sm-8'>500 g</div></div></div>");

        scraper.enrichPackFromDetail(detail, p);

        assertEquals(500.0, p.getPrimaryWeightGrams());
        assertEquals(List.of("500g"), p.getPackage_weight());
    }

    // ------------------------------------------------------------------ Pansport

    private PansportScraper pansport() {
        return new PansportScraper(null, mock(BaseScraperEnricher.class), null, null, new com.proteinoteka.util.WeightParser());
    }

    // Real teasers of pansport.rs/kreatin (2026-09-20). A pack counted in pieces ("120 kapsula") has no
    // gram weight; on the creatine listing it is a product, on the protein listing a sachet-like option.
    @Test
    void pansportCreatineKeepsPiecePacksAndSmallTubs() throws IOException {
        Document doc = html("pansport_creatine_listing.html");

        List<Product> products = pansport().scrape(CREATINE, creatineProfile, null, doc, Set.of());

        assertEquals(5, products.size(), products.stream().map(p -> p.getName() + " " + p.getVariantLabel()).toList().toString());
        Product tablets = products.stream().filter(p -> p.getName().equals("Creatine Zero")).findFirst().orElseThrow();
        assertEquals("18 tableta", tablets.getVariantLabel());
        assertNull(tablets.getPrimaryWeightGrams());
        assertTrue(tablets.getPackage_weight().isEmpty(), "a piece count is not a package weight");
        Product capsules = products.stream().filter(p -> p.getName().equals("Creatine 3000")).findFirst().orElseThrow();
        assertEquals("120 kapsula", capsules.getVariantLabel());

        Product tub = products.stream().filter(p -> p.getName().startsWith("Tri")).findFirst().orElseThrow();
        assertEquals(200.0, tub.getPrimaryWeightGrams());
    }

    // Only the selected size carries a price on the listing; the other one needs the detail page.
    @Test
    void pansportMultiSizeProductGivesOneVariantPerSizeWithAPriceOnlyOnTheSelectedOne() throws IOException {
        Document doc = html("pansport_creatine_listing.html");

        List<Product> sizes = pansport().scrape(CREATINE, creatineProfile, null, doc, Set.of()).stream()
                .filter(p -> p.getName().equals("Creatine Monohydrate")).toList();

        assertEquals(2, sizes.size());
        Product selected = sizes.stream().filter(p -> p.getPrimaryWeightGrams() == 500.0).findFirst().orElseThrow();
        Product other = sizes.stream().filter(p -> p.getPrimaryWeightGrams() == 300.0).findFirst().orElseThrow();
        assertNotNull(selected.getPrice());
        assertNull(other.getPrice());
        assertNotEquals(selected.getUrl(), other.getUrl());
    }

    @Test
    void pansportProteinListingStillDropsPiecePacksAndSachetOptions() throws IOException {
        Document doc = html("pansport_creatine_listing.html");

        List<Product> products = pansport().scrape(null, doc, Set.of());

        // the 200 g tub and the two sizes of the monohydrate; both piece packs are dropped as before
        assertEquals(3, products.size(), products.stream().map(Product::getName).toList().toString());
        assertTrue(products.stream().allMatch(p -> p.getPrimaryWeightGrams() != null && p.getPrimaryWeightGrams() >= 100));
    }

    // ------------------------------------------------------------------ Proteini.si HR

    private ProteiniSiHrScraper proteiniSiHr() {
        return new ProteiniSiHrScraper(mock(BaseScraperEnricher.class), null, null);
    }

    // The creatine category page also lists stacks and pre-workouts filed under other categories.
    @Test
    void proteiniSiHrCreatineListingKeepsOnlyCreatineUrls() throws IOException {
        Document doc = html("proteinisi_hr_creatine_listing.html");
        Set<String> allDetailsKnown = doc.select("a.product-box").stream()
                .map(a -> "https://www.proteini.si" + a.attr("href")).collect(Collectors.toSet());

        List<Product> products = proteiniSiHr().scrape(CREATINE, creatineProfile, null, doc, allDetailsKnown);

        assertEquals(3, products.size(), names(products).toString());
        assertTrue(products.stream().allMatch(p -> p.getUrl().contains("/hr/kreatin/")), urlsOf(products).toString());
        assertTrue(names(products).contains("VAST CREATINE ULTRA PURE CAPS, 300 kapsula"));
    }

    // The protein listing keeps skipping creatine products (they are scraped from their own listing).
    @Test
    void proteiniSiHrProteinListingStillSkipsCreatineUrls() throws IOException {
        Document doc = html("proteinisi_hr_creatine_listing.html");
        Set<String> allDetailsKnown = doc.select("a.product-box").stream()
                .map(a -> "https://www.proteini.si" + a.attr("href")).collect(Collectors.toSet());

        List<Product> products = proteiniSiHr().scrape(null, doc, allDetailsKnown);

        assertEquals(3, products.size(), names(products).toString());
        assertTrue(products.stream().noneMatch(p -> p.getUrl().contains("/kreatin/")), urlsOf(products).toString());
    }

    // ------------------------------------------------------------------ Proteka HR

    private ProtekaHrScraper protekaHr() {
        return new ProtekaHrScraper(mock(BaseScraperEnricher.class), null, objectMapper);
    }

    @Test
    void protekaCreatineListingKeepsTheKreatiniCategoryAndReadsWeightsFromNames() throws IOException {
        Document doc = html("proteka_hr_creatine_listing.html");
        Set<String> allDetailsKnown = doc.select("div[data-filterable-item] .product-title a").stream()
                .map(a -> a.attr("href")).collect(Collectors.toSet());

        List<Product> products = protekaHr().scrape(CREATINE, creatineProfile, null, doc, allDetailsKnown);

        // 4 cards in the category; the "2+1 GRATIS" promo pack is rejected by the creatine profile
        assertEquals(3, products.size(), names(products).toString());
        assertTrue(names(products).stream().noneMatch(n -> n.contains("GRATIS")), names(products).toString());
        Product weider = products.stream().filter(p -> p.getName().startsWith("Pure Creatine Weider")).findFirst().orElseThrow();
        assertEquals(250.0, weider.getPrimaryWeightGrams());
        assertEquals("Weider", weider.getBrand());
    }

    // A "Kreatini" card never belongs in the protein listing.
    @Test
    void protekaProteinListingStillSkipsTheKreatiniCategory() throws IOException {
        Document doc = html("proteka_hr_creatine_listing.html");

        assertTrue(protekaHr().scrape(null, doc, Set.of()).isEmpty());
    }

    // ------------------------------------------------------------------ MyProtein

    private static Product stub(String url) {
        Product p = new Product();
        p.setUrl(url);
        p.setName("stub");
        return p;
    }

    private JsonNode fixture(String name) throws IOException {
        return objectMapper.readTree(new File("src/test/resources/myprotein/" + name));
    }

    // "Kreatin HCL" is sold as 100 g and 500 g; protein's 500 g floor would drop the small tub.
    @Test
    void myProteinRsCreatineKeepsSmallTubsThatProteinsFloorDrops() throws IOException {
        MyProteinScraper scraper = new MyProteinScraper(null, null, null);
        JsonNode hcl = fixture("creatine_hcl_masterdata.json");
        Product stub = stub("https://www.myprotein.rs/p/sports-nutrition/kreatin-hcl/17169974/");

        List<Product> creatine = scraper.expandByVariants(hcl, stub, 60, false);
        List<Product> protein = scraper.expandByVariants(hcl, stub);

        assertEquals(List.of("100g", "500g"), creatine.stream().map(v -> v.getPackage_weight().get(0)).toList());
        assertEquals(List.of("867", "2895"), creatine.stream().map(Product::getPrice).toList());
        assertEquals(List.of("500g"), protein.stream().map(v -> v.getPackage_weight().get(0)).toList());
        assertEquals("100g", creatine.get(0).getVariantLabel(), "the parser derives servings from the pack size");
    }

    // Real data: Micronised Creatine sells 250 g and 500 g for the same 4198 RSD. Keyed by price they
    // collapsed into one "250 g" row (16.8 RSD/g instead of the real 8.4 RSD/g of the 500 g pack).
    @Test
    void myProteinRsCreatineKeepsTwoPackSizesThatShareAPrice() throws IOException {
        MyProteinScraper scraper = new MyProteinScraper(null, null, null);
        JsonNode micronised = fixture("creatine_micronised_same_price_masterdata.json");
        Product stub = stub("https://www.myprotein.rs/p/sports-nutrition/myprotein-micronised-creatine-powder/17902344/");

        List<Product> creatine = scraper.expandByVariants(micronised, stub, 60, false);
        List<Product> protein = scraper.expandByVariants(micronised, stub, 60, true);

        assertEquals(Set.of("250g", "500g"),
                creatine.stream().map(v -> v.getPackage_weight().get(0)).collect(Collectors.toSet()));
        assertTrue(creatine.stream().allMatch(v -> v.getPrice().equals("4198")));
        assertEquals(1, protein.size(), "protein tiers are keyed by price, as before");
    }

    // "90 TABLETS - 30 servings" and "83servings" have no gram weight, so they cannot be priced per gram.
    @Test
    void myProteinCountOnlyPacksAreSkippedForNow() throws IOException {
        JsonNode countOnly = fixture("creatine_monohydrate_count_only_masterdata.json");
        Product stub = stub("https://www.myprotein.rs/p/sports-nutrition/creatine-monohydrate/10575029/");

        assertTrue(new MyProteinScraper(null, null, null).expandByVariants(countOnly, stub, 60, false).isEmpty());
        assertTrue(new MyProteinHrScraper(null, null, null)
                .expandByVariants(fixture("creatine_gummies_hr_masterdata.json"), stub, 60, false).isEmpty());
    }

    // HR: the serving count of a creatine powder varies per flavour ("250g - 54Porcija", "250g - 73Porcija"),
    // so protein's tiers-by-servings would list one 250 g tub four times.
    @Test
    void myProteinHrCreatinePowderIsOneVariantPerPackSize() throws IOException {
        MyProteinHrScraper scraper = new MyProteinHrScraper(null, null, null);
        JsonNode powder = fixture("creatine_monohydrate_hr_masterdata.json");
        Product stub = stub("https://www.myprotein.hr/p/sports-nutrition/kreatin-monohidrat/12456626/");

        List<Product> byGrams = scraper.expandByVariants(powder, stub, 60, false);
        List<Product> byServings = scraper.expandByVariants(powder, stub, 60, true);

        assertEquals(Set.of("100g", "250g", "500g", "1kg"),
                byGrams.stream().map(v -> v.getPackage_weight().get(0)).collect(Collectors.toSet()));
        assertEquals(4, byGrams.size(), "one row per pack size");
        Product kilo = byGrams.stream().filter(v -> v.getPackage_weight().contains("1kg")).findFirst().orElseThrow();
        assertEquals("57.99", kilo.getPrice(), "the cheapest 1 kg variant (the other one is 59.99)");
        assertTrue(byServings.size() > byGrams.size(), "the protein grouping would duplicate the same pack sizes");
    }

    // The protein path of both scrapers is unchanged: still 500 g.
    @Test
    void myProteinProteinFloorIsUnchanged() throws IOException {
        JsonNode hcl = fixture("creatine_hcl_masterdata.json");
        Product stub = stub("https://www.myprotein.hr/p/x/1/");

        List<Product> variants = new MyProteinHrScraper(null, null, null).expandByVariants(hcl, stub);

        assertTrue(variants.stream().allMatch(v -> v.getPrimaryWeightGrams() >= 500), variants.toString());
    }

    @Test
    void proteinProfileIsNotUsedForCreatineListings() {
        // guards the ListingFamily wiring: a creatine target must never resolve to the protein rules
        ListingFamily family = ListingFamily.of(CREATINE, creatineProfile);
        assertTrue(family.isCreatine());
        assertNotEquals(ProteinProfile.class, family.profile().getClass());
    }
}
