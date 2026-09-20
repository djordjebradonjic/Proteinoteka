package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ValueScoreAuditTest {

    private static final Map<String, Double> BRANDS = Map.of("known", 7.0);
    private static long nextId = 1;

    private static Product product(String name, String brand, double protein, double grams, String source, double price) {
        Product p = new Product();
        p.setId(nextId++);
        p.setName(name);
        p.setBrand(brand);
        p.setProteinPer100g(protein);
        p.setPrimaryWeightGrams(grams);
        p.setProteinSource(source);
        p.setNumericPrice(price);
        p.setSugarPer100g(2.0);
        p.setFatPer100g(2.0);
        p.setDescription("desc");
        p.setCurrency("RSD");
        p.setMarket("rs");
        return p;
    }

    private static Product scored(Product p) {
        p.setValueScore(ValueScoreCalculator.score(p.getNumericPrice(), p, 7.0));
        return p;
    }

    private static boolean has(List<String> issues, String code) {
        return issues.stream().anyMatch(i -> i.startsWith(code));
    }

    @Test
    void cleanCatalogueProducesNoProductLevelIssues() {
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            ps.add(scored(product("Whey " + i, "Known", 80, 1000, "whey_concentrate", 4400 + i * 100)));
        }
        List<String> issues = ValueScoreAudit.run(ps, BRANDS);
        assertTrue(issues.isEmpty(), issues.toString());
    }

    @Test
    void staleScoreOnUnscoreableProductIsReported() {
        Product gainer = product("Mutant Mass - PVL", "Known", 86.67, 2270, "whey_concentrate", 3490);
        gainer.setValueScore(8.2); // what the old code stored
        List<String> issues = ValueScoreAudit.run(List.of(gainer), BRANDS);
        assertTrue(has(issues, "VALUE_SCORE_STALE"), issues.toString());
    }

    @Test
    void storedScoreThatNoLongerMatchesTheFormulaIsReported() {
        Product p = product("Whey", "Known", 80, 1000, "whey_concentrate", 4400);
        p.setValueScore(3.1);
        assertTrue(has(ValueScoreAudit.run(List.of(p), BRANDS), "VALUE_SCORE_STALE"));
    }

    @Test
    void implausibleProteinIsFlaggedForReview() {
        Product p = product("Isolate Whey Protein 100%", "Known", 30, 750, "whey_isolate", 4750);
        List<String> issues = ValueScoreAudit.run(List.of(p), BRANDS);
        assertTrue(has(issues, "VALUE_SCORE_SKIPPED"), issues.toString());
    }

    @Test
    void priceOutlierAgainstSameTypeMedianIsFlagged() {
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            ps.add(scored(product("Whey " + i, "Known", 80, 1000, "whey_concentrate", 4400 + i * 50)));
        }
        // 5.5 RSD/g typical; this one is ~2.1 RSD/g: passes the 0.25x benchmark floor but is <0.4x the median
        Product cheap = scored(product("Suspicious Whey", "Known", 80, 1000, "whey_concentrate", 1700));
        ps.add(cheap);
        List<String> issues = ValueScoreAudit.run(ps, BRANDS);
        assertTrue(issues.stream().anyMatch(i -> i.startsWith("PRICE_OUTLIER") && i.contains("Suspicious Whey")), issues.toString());
    }

    @Test
    void unknownAndGarbageBrandsAreReported() {
        Product a = scored(product("Whey A", "Brand Nobody Added", 80, 1000, "whey_concentrate", 4400));
        Product b = scored(product("Whey B", "g | Biljni Protein iz kanadskog graška sa 80% proteina", 80, 1000, "whey_concentrate", 4400));
        List<String> issues = ValueScoreAudit.run(List.of(a, b), BRANDS);
        assertTrue(has(issues, "UNKNOWN_BRAND"), issues.toString());
        assertTrue(has(issues, "BRAND_SUSPECT"), issues.toString());
    }

    @Test
    void weightThatContradictsTheNameIsFlagged() {
        Product p = scored(product("SNICKERS HI PROTEIN POWDER, 875g", "Known", 57, 480, "blend", 4500));
        assertNotNull(ValueScoreCalculator.weightNameMismatch(p, ValueScoreAudit.WEIGHT_NAME_TOLERANCE));
        Product ok = product("Gold Standard 2,27kg", "Known", 80, 2270, "whey_concentrate", 9000);
        assertNull(ValueScoreCalculator.weightNameMismatch(ok, ValueScoreAudit.WEIGHT_NAME_TOLERANCE));
        Product bundle = product("Pro Whey 2.27kg / L-Citrulline 400g", "Known", 80, 2270, "whey_concentrate", 9000);
        assertNull(ValueScoreCalculator.weightNameMismatch(bundle, ValueScoreAudit.WEIGHT_NAME_TOLERANCE));
        Product multipack = product("Natural Whey, 35x30g", "Known", 80, 1050, "whey_concentrate", 9000);
        assertNull(ValueScoreCalculator.weightNameMismatch(multipack, ValueScoreAudit.WEIGHT_NAME_TOLERANCE));
        Product kgTypo = product("Whey 2,3g", "Known", 80, 2300, "whey_concentrate", 9000);
        assertNull(ValueScoreCalculator.weightNameMismatch(kgTypo, ValueScoreAudit.WEIGHT_NAME_TOLERANCE));
    }

    @Test
    void benchmarkDriftIsDetectedWhenMarketMovesAwayFromTheConstant() {
        // 20 blends all at 9 RSD/g protein vs a 5.3 benchmark => +/-40% drift
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            ps.add(scored(product("Blend " + i, "Known", 80, 1000, "blend", 7200 + i)));
        }
        assertTrue(has(ValueScoreAudit.run(ps, BRANDS), "BENCHMARK_DRIFT"));
    }

    // ------------------------------------------------------------------ creatine

    private static Product creatine(String name, String form, Double grams, double price) {
        Product p = new Product();
        p.setId(nextId++);
        p.setName(name);
        p.setBrand("Known");
        p.setProductType("creatine");
        p.setProductForm(form);
        p.setPrimaryWeightGrams(grams);
        p.setNumericPrice(price);
        p.setCurrency("RSD");
        p.setMarket("rs");
        return p;
    }

    private static Product scoredCreatine(Product p) {
        p.setValueScore(ValueScoreCalculator.score(p.getNumericPrice(), p, 7.0));
        return p;
    }

    // Creatine used to be dropped from the audit altogether ("not supported yet").
    @Test
    void aCleanCreatineCatalogueProducesNoIssues() {
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 8; i++) ps.add(scoredCreatine(creatine("Creatine Monohydrate " + i, "powder", 500.0, 3200 + i * 100)));

        List<String> issues = ValueScoreAudit.run(ps, BRANDS);

        assertTrue(issues.isEmpty(), issues.toString());
    }

    @Test
    void anImplausibleCreatinePriceIsReportedForReview() {
        // 1 RSD/g for a 500 g tub is a scraping error (or not creatine); 100 RSD/g likewise
        List<String> issues = ValueScoreAudit.run(List.of(
                creatine("Creatine Monohydrate", "powder", 500.0, 500),
                creatine("Creatine Monohydrate", "powder", 500.0, 50000)), BRANDS);

        assertEquals(2, issues.stream().filter(i -> i.startsWith("VALUE_SCORE_SKIPPED")).count(), issues.toString());
    }

    @Test
    void aStaleCreatineScoreIsReported() {
        Product tub = creatine("Creatine Monohydrate", "powder", 500.0, 3200);
        tub.setValueScore(1.0); // stored before the benchmark moved

        assertTrue(has(ValueScoreAudit.run(List.of(tub), BRANDS), "VALUE_SCORE_STALE"));
    }

    @Test
    void aCreatinePriceFarFromTheMarketMedianIsAnOutlier() {
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 8; i++) ps.add(scoredCreatine(creatine("Creatine " + i, "powder", 500.0, 3300 + i * 20)));
        // 18 RSD/g against a ~6.7 median (2.7x): dear, but inside the believable range of a scored listing
        ps.add(scoredCreatine(creatine("Creatine premium", "powder", 500.0, 9000)));

        List<String> issues = ValueScoreAudit.run(ps, BRANDS);

        assertTrue(has(issues, "PRICE_OUTLIER"), issues.toString());
    }

    @Test
    void aDriftedCreatineBenchmarkIsReportedOnceTheSampleIsBigEnough() {
        // twenty tubs at 4 RSD/g while the benchmark says 10: the market moved, recalibrate
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 20; i++) ps.add(scoredCreatine(creatine("Creatine " + i, "powder", 500.0, 2000 + i * 10)));

        assertTrue(has(ValueScoreAudit.run(ps, BRANDS), "BENCHMARK_DRIFT"));
        assertFalse(has(ValueScoreAudit.run(ps.subList(0, 5), BRANDS), "BENCHMARK_DRIFT"), "too few rows to judge");
    }

    @Test
    void piecePacksAreNeverScoredAndTheGapIsReportedOnce() {
        Product capsules = creatine("Kre-Alkalyn 120cap", "capsule", null, 3400);
        Product gummies = creatine("Creatine gummies", "gummy", 300.0, 2800); // even with a weight: mostly sugar

        assertFalse(ValueScoreCalculator.evaluate(3400.0, capsules, 7.0).scored());
        assertEquals(ValueScoreCalculator.SkipReason.COUNTED_FORM,
                ValueScoreCalculator.evaluate(2800.0, gummies, 7.0).skipReason());

        List<String> issues = ValueScoreAudit.run(List.of(capsules, gummies), BRANDS);
        assertEquals(1, issues.stream().filter(i -> i.startsWith("CREATINE_UNSCORED_COUNTED_FORMS")).count(), issues.toString());
        assertTrue(issues.stream().anyMatch(i -> i.contains("2 ")), issues.toString());
    }

    @Test
    void creatineDoesNotDisturbTheProteinMedians() {
        List<Product> ps = new ArrayList<>();
        for (int i = 0; i < 8; i++) ps.add(scored(product("Whey " + i, "Known", 80, 1000, "whey_concentrate", 4400 + i * 100)));
        for (int i = 0; i < 8; i++) ps.add(scoredCreatine(creatine("Creatine " + i, "powder", 500.0, 3300 + i * 20)));

        List<String> issues = ValueScoreAudit.run(ps, BRANDS);

        assertTrue(issues.isEmpty(), issues.toString());
    }
}
