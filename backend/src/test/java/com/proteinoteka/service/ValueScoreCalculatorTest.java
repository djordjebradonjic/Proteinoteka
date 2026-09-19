package com.proteinoteka.service;

import com.proteinoteka.dto.ValueScoreBreakdown;
import com.proteinoteka.model.Product;
import com.proteinoteka.service.ValueScoreCalculator.BeefContent;
import com.proteinoteka.service.ValueScoreCalculator.SkipReason;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Regression tests for the value-score audit (Sept 2026). Every case is a real product that
 * previously got a wrong score.
 */
class ValueScoreCalculatorTest {

    private static final double MID_BRAND = 7.0;

    private static Product whey(String name, double protein, double grams, String source) {
        Product p = new Product();
        p.setName(name);
        p.setBrand("Test");
        p.setProteinPer100g(protein);
        p.setPrimaryWeightGrams(grams);
        p.setProteinSource(source);
        p.setSugarPer100g(2.0);
        p.setFatPer100g(2.0);
        p.setDescription("Whey protein");
        p.setCurrency("RSD");
        return p;
    }

    /** A price giving exactly {@code rsdPerGramProtein} for the product. */
    private static double priceFor(Product p, double rsdPerGramProtein) {
        return rsdPerGramProtein * p.getProteinPer100g() / 100.0 * p.getPrimaryWeightGrams();
    }

    // ------------------------------------------------------------------ beef / collagen

    @Test
    void njegovihProteina_isNotBeef() {
        // "…80% svih njegovih proteina…" used to match gov\S*\s+protein (no word boundary)
        Product p = whey("Micellar casein 910g - BioTechUSA", 80, 910, "casein");
        p.setDescription("Kazein je osnovni gradivni protein mleka koji čini 80% svih njegovih proteina, i proteina surutke");
        assertEquals(BeefContent.NONE, ValueScoreCalculator.beefContent(p));
    }

    @Test
    void njegovProteinski_odgovaraProteinski_areNotBeef() {
        Product vegan = whey("Vegan Protein", 73, 900, "vegan");
        vegan.setDescription("Njegov proteinski sastav koji je baziran na biljkama");
        Product basic = whey("PRO WHEY 4300GR", 75, 4300, "whey_concentrate");
        basic.setDescription("Za osobe kojima odgovara proteinski napitak nakon treninga");
        assertEquals(BeefContent.NONE, ValueScoreCalculator.beefContent(vegan));
        assertEquals(BeefContent.NONE, ValueScoreCalculator.beefContent(basic));
    }

    @Test
    void cowsMilkOrSerumAlbumin_isNotBeef() {
        Product p = whey("Whey", 80, 1000, "whey_concentrate");
        p.setDescription("Proizvedeno od goveđeg mleka, sadrži goveđi serumski albumin");
        assertEquals(BeefContent.NONE, ValueScoreCalculator.beefContent(p));
    }

    @Test
    void beefInNameOrSource_isPrimary() {
        assertEquals(BeefContent.PRIMARY, ValueScoreCalculator.beefContent(whey("Monster Beef Protein", 80, 1000, "hydrolysate")));
        assertEquals(BeefContent.PRIMARY, ValueScoreCalculator.beefContent(whey("HydroBeef Protein", 85, 1000, "hydrolysate")));
        assertEquals(BeefContent.PRIMARY, ValueScoreCalculator.beefContent(whey("Goveđi protein", 85, 1000, null)));
        assertEquals(BeefContent.PRIMARY, ValueScoreCalculator.beefContent(whey("Some Protein", 85, 1000, "beef")));
    }

    @Test
    void beefOnlyAsIngredient_isIngredientNotPrimary() {
        Product p = whey("Protein matrix 750g", 75, 750, "blend");
        p.setDescription("koncentrat surutke, mlečni protein, hidrolizovani izolat goveđeg proteina (10%)");
        assertEquals(BeefContent.INGREDIENT, ValueScoreCalculator.beefContent(p));
    }

    @Test
    void beefIngredient_costsLittle_beefPrimary_costsALot() {
        Product clean = whey("Whey", 80, 1000, "whey_concentrate");
        Product ingredient = whey("Whey", 80, 1000, "whey_concentrate");
        ingredient.setDescription("hidrolizat goveđeg proteina");
        Product primary = whey("Whey Beef", 80, 1000, "beef");
        double price = priceFor(clean, 5.0);

        double sClean = ValueScoreCalculator.score(price, clean, MID_BRAND);
        double sIngredient = ValueScoreCalculator.score(price, ingredient, MID_BRAND);
        double sPrimary = ValueScoreCalculator.score(price, primary, MID_BRAND);

        assertTrue(sClean - sIngredient > 0.2 && sClean - sIngredient < 0.9,
                "ingredient deduction should be small: " + sClean + " vs " + sIngredient);
        assertTrue(sClean - sPrimary > 2.0, "beef as the protein source should be heavily penalised");
        assertTrue(ValueScoreCalculator.breakdown(price, ingredient, MID_BRAND).beefCollagenFiller());
    }

    // ------------------------------------------------------------------ eligibility

    @Test
    void massGainerWithBogusProteinIsNotScored() {
        // PVL Mutant Mass was scraped as 86.67% protein and ranked in the top 5% "best value"
        Product p = whey("Mutant Mass - PVL", 86.67, 2270, "whey_concentrate");
        assertEquals(SkipReason.NOT_PROTEIN_POWDER,
                ValueScoreCalculator.evaluate(3490.0, p, MID_BRAND).skipReason());
        assertNull(ValueScoreCalculator.score(3490.0, p, MID_BRAND));
    }

    @Test
    void gainersBarsAndMealReplacementsAreNotScored() {
        String[] names = {
                "Anabolic Masster - Amix", "Muscle juice revolution 2600 5kg", "Total Mass Matrix",
                "IRONMAXX PROTEIN & NUT BAR, 24x45g", "VAST BAR, 12x45g", "Dijetalni Zamenski Obrok",
                "Veganski zamjenski obrok", "USN DIET FUEL, 1000g", "Breakfast Smoothie"
        };
        for (String n : names) {
            Product p = whey(n, 46, 1000, "blend");
            assertFalse(ValueScoreCalculator.evaluate(4000.0, p, MID_BRAND).scored(), n + " must not be scored");
            assertTrue(ValueScoreCalculator.isNonPowderName(n) || p.getProteinPer100g() < 55, n);
        }
    }

    @Test
    void ordinaryWheyNamesAreNotMistakenForNonPowders() {
        String[] names = {
                "Gold Standard 100% Whey", "Iso Whey Zero", "Diet Whey Protein 1kg",
                "Impact Whey Isolate", "BATTERY COMPLETE ISOLATE", "Whey Protein Complex 100%",
                "Barebells-free Whey", "Pure Whey Bark Chocolate", "100% Casein"
        };
        for (String n : names) {
            Product p = whey(n, 80, 1000, "whey_concentrate");
            assertTrue(ValueScoreCalculator.evaluate(priceFor(p, 5.5), p, MID_BRAND).scored(), n + " must be scored");
        }
    }

    @Test
    void isolateLabelledProductWith30PercentProteinIsAParseErrorNotALowScore() {
        // Maximalium isolate was stored at 30% (siblings on other stores had 94%) and scored 3.6
        Product p = whey("Isolate Whey Protein 100%, 750g", 30, 750, "whey_isolate");
        assertEquals(SkipReason.IMPLAUSIBLE_PROTEIN, ValueScoreCalculator.evaluate(4750.0, p, MID_BRAND).skipReason());
    }

    @Test
    void proteinAbove95IsImplausible() {
        Product p = whey("Pro Whey 100% 2.27kg + L-Citrulline + Creatine", 100, 2270, "whey_concentrate");
        assertEquals(SkipReason.IMPLAUSIBLE_PROTEIN, ValueScoreCalculator.evaluate(15150.0, p, MID_BRAND).skipReason());
    }

    @Test
    void missingPriceProteinOrWeightIsMissingData() {
        Product p = whey("Whey", 80, 1000, "whey_concentrate");
        assertEquals(SkipReason.MISSING_DATA, ValueScoreCalculator.evaluate(null, p, MID_BRAND).skipReason());
        assertEquals(SkipReason.MISSING_DATA, ValueScoreCalculator.evaluate(0.0, p, MID_BRAND).skipReason());
        p.setPrimaryWeightGrams(null);
        assertEquals(SkipReason.MISSING_DATA, ValueScoreCalculator.evaluate(3000.0, p, MID_BRAND).skipReason());
        p.setPrimaryWeightGrams(1000.0);
        p.setProteinPer100g(null);
        assertEquals(SkipReason.MISSING_DATA, ValueScoreCalculator.evaluate(3000.0, p, MID_BRAND).skipReason());
    }

    // ------------------------------------------------------------------ price plausibility

    @Test
    void absurdlyCheapPriceIsRejectedInsteadOfRewardedWithMaxValue() {
        // MyProtein "Impact Whey Isolate Milkšejk" 2.7kg @ 2895 RSD = ~1.4 RSD/g protein (isolate benchmark 7.5)
        Product p = whey("Impact Whey Isolate Milkšejk", 74, 2700, "whey_isolate");
        assertEquals(SkipReason.IMPLAUSIBLE_PRICE, ValueScoreCalculator.evaluate(2895.0, p, 8.0).skipReason());
    }

    @Test
    void absurdlyExpensivePriceIsRejected() {
        Product p = whey("Whey", 80, 1000, "whey_concentrate");
        assertEquals(SkipReason.IMPLAUSIBLE_PRICE, ValueScoreCalculator.evaluate(priceFor(p, 60), p, MID_BRAND).skipReason());
        p.setCurrency("EUR");
        assertEquals(SkipReason.IMPLAUSIBLE_PRICE, ValueScoreCalculator.evaluate(priceFor(p, 0.6), p, MID_BRAND).skipReason());
    }

    @Test
    void cheapestLegitimateProductsStillScore() {
        // BioTech Power Protein 4kg @ 6190 RSD (~0.30x of the old blend benchmark) is real, sold by 4 stores
        Product power = whey("Power protein 4kg - BioTechUSA", 81, 4000, "blend");
        assertTrue(ValueScoreCalculator.evaluate(6190.0, power, 7.5).scored());
        // GymBeam soy isolate 1kg @ 1600 RSD
        Product soy = whey("Protein Soy Isolate - GymBeam", 77, 1000, "vegan");
        assertTrue(ValueScoreCalculator.evaluate(1600.0, soy, 7.0).scored());
    }

    @Test
    void weightInNameContradictingStoredWeightIsNotScored() {
        // "SNICKERS HI PROTEIN POWDER, 875g" was stored as 480g: price/g protein (and score) was 45% off
        Product p = whey("SNICKERS HI PROTEIN POWDER, 875g", 57, 480, "blend");
        assertEquals(SkipReason.CONFLICTING_WEIGHT, ValueScoreCalculator.evaluate(3766.0, p, MID_BRAND).skipReason());
    }

    @Test
    void weightNameCheckToleratesBundlesMultipacksTyposAndSmallDrift() {
        Product bundle = whey("Pro Whey 2.27kg / L-Citrulline 400g", 80, 2270, "whey_concentrate");
        Product multipack = whey("Natural Whey, 35x30g", 80, 1050, "whey_concentrate");
        Product kgTypo = whey("Whey 2,3g", 80, 2300, "whey_concentrate");
        Product drift = whey("100% Pure Whey 400 g", 78, 454, "whey_concentrate"); // 13.5% — reported, still scored
        for (Product p : new Product[]{bundle, multipack, kgTypo, drift}) {
            assertTrue(ValueScoreCalculator.evaluate(priceFor(p, 5.5), p, MID_BRAND).scored(), p.getName());
        }
    }

    // ------------------------------------------------------------------ source normalisation

    @Test
    void hydroInNameOverridesWheyConcentrateLabel() {
        Product p = whey("THE Amino Whey Hydro protein 3.5KG", 85.7, 3500, "whey_concentrate");
        assertEquals("hydrolysate", ValueScoreCalculator.effectiveSource(p));
    }

    @Test
    void hydroInNameDoesNotOverrideCaseinVeganOrBeef() {
        assertEquals("casein", ValueScoreCalculator.effectiveSource(whey("HydroX Micellar Casein, 2 kg", 81, 2000, "casein")));
        assertEquals("beef", ValueScoreCalculator.effectiveSource(whey("HydroBeef Protein", 85, 1000, "beef")));
        assertEquals("hydrolysate", ValueScoreCalculator.effectiveSource(whey("HydroBeef Protein", 85, 1000, "hydrolysate")));
    }

    // ------------------------------------------------------------------ formula sanity

    @Test
    void cheaperIsBetter_isolateBeatsConcentrateAtSamePrice_andScoreStaysInRange() {
        Product conc = whey("Whey", 78, 1000, "whey_concentrate");
        Product iso = whey("Whey", 90, 1000, "whey_isolate");
        double price = priceFor(iso, 6.5);
        ValueScoreBreakdown bIso = ValueScoreCalculator.breakdown(price, iso, MID_BRAND);
        ValueScoreBreakdown bConc = ValueScoreCalculator.breakdown(price, conc, MID_BRAND);
        assertTrue(bIso.total() > bConc.total());

        double cheap = ValueScoreCalculator.score(priceFor(conc, 4.5), conc, MID_BRAND);
        double dear = ValueScoreCalculator.score(priceFor(conc, 9.0), conc, MID_BRAND);
        assertTrue(cheap > dear);
        for (double s : new double[]{cheap, dear, bIso.total(), bConc.total()}) {
            assertTrue(s >= 0 && s <= 10);
        }
    }

    @Test
    void brandScoreMovesTheScore_unknownBrandDefaultIsLowerThanEstablished() {
        Product p = whey("Whey", 80, 1000, "whey_concentrate");
        double price = priceFor(p, 5.5);
        double unknown = ValueScoreCalculator.score(price, p, ValueScoreCalculator.DEFAULT_BRAND_SCORE);
        double established = ValueScoreCalculator.score(price, p, 7.0);
        assertTrue(established - unknown > 0.4);
    }

    @Test
    void benchmarkCoversEverySourceAndBothCurrencies() {
        for (String cur : new String[]{"RSD", "EUR"}) {
            for (String src : new String[]{"whey_isolate", "whey_concentrate", "hydrolysate", "casein", "vegan", "blend", "egg", "beef", null}) {
                assertTrue(ValueScoreCalculator.benchmark(src, cur) > 0, src + "/" + cur);
            }
        }
        // beef used to fall through to the concentrate default; it has its own (lower) benchmark now
        assertTrue(ValueScoreCalculator.benchmark("beef", "RSD") < ValueScoreCalculator.benchmark("whey_concentrate", "RSD"));
        assertTrue(ValueScoreCalculator.benchmark("beef", "EUR") < ValueScoreCalculator.benchmark("whey_concentrate", "EUR"));
    }

    // ------------------------------------------------------------------ creatine

    private static Product creatine(String currency, double grams) {
        Product c = new Product();
        c.setProductType("creatine");
        c.setName("Creatine Monohydrate");
        c.setCurrency(currency);
        c.setPrimaryWeightGrams(grams);
        return c;
    }

    @Test
    void creatineIsScoredAgainstTheMeasuredMarketMedianPerGram() {
        Product c = creatine("RSD", 500.0);
        // market medians 2026-09-19: RS 9.95 RSD/g, HR 0.083 EUR/g
        double atMedian = ValueScoreCalculator.score(5000.0, c, MID_BRAND);     // 10 RSD/g
        double cheap = ValueScoreCalculator.score(3000.0, c, MID_BRAND);        // 6 RSD/g (a bulk tub)
        double pricey = ValueScoreCalculator.score(7500.0, c, MID_BRAND);       // 15 RSD/g

        assertTrue(atMedian > 5 && atMedian < 8, "a median-priced listing is decent, not perfect: " + atMedian);
        assertTrue(cheap > 8, "a clearly cheaper listing scores high: " + cheap);
        assertTrue(cheap > atMedian && atMedian > pricey);
        assertTrue(pricey < atMedian - 2, "50% above the median loses several points: " + pricey + " vs " + atMedian);
    }

    @Test
    void creatineInEuroUsesItsOwnBenchmarkAndAgreesWithRsd() {
        double eur = ValueScoreCalculator.score(42.5, creatine("EUR", 500.0), MID_BRAND);    // 0.085 EUR/g
        double rsd = ValueScoreCalculator.score(5000.0, creatine("RSD", 500.0), MID_BRAND);  // 10 RSD/g
        assertEquals(rsd, eur, 0.5, "the same real price level scores the same in both currencies");
    }

    @Test
    void creatineOutsideAnyBelievablePriceOrWithoutDataIsNotScored() {
        Product c = creatine("RSD", 500.0);
        assertNull(ValueScoreCalculator.score(null, c, MID_BRAND));
        assertNull(ValueScoreCalculator.score(25000.0, c, MID_BRAND), "50 RSD/g is above 4x the median");
        assertNotNull(ValueScoreCalculator.score(14500.0, c, MID_BRAND), "29 RSD/g is a real (premium GAA blend) listing");
        assertNull(ValueScoreCalculator.score(5000.0, creatine("RSD", 0.0), MID_BRAND), "no pack weight");
        assertEquals(ValueScoreCalculator.SkipReason.IMPLAUSIBLE_PRICE,
                ValueScoreCalculator.evaluate(25000.0, c, MID_BRAND).skipReason());
    }

    @Test
    void aCarbohydrateMixSoldUnderACreatineNameIsNotRankedAsTheBestValue() {
        // real listings from nutrition-shop.hr / proteini-outlet.com, 2026-09-19: 0.022 and 0.027 EUR/g,
        // against 0.047 EUR/g for the cheapest real creatine powder
        assertNull(ValueScoreCalculator.score(13.0, creatine("EUR", 600.0), MID_BRAND), "Nutrend Creaport 600 g");
        assertNull(ValueScoreCalculator.score(53.0, creatine("EUR", 2000.0), MID_BRAND), "Amix VitarGO + Kre-Alkalyn 2 kg");
        assertNotNull(ValueScoreCalculator.score(18.7, creatine("EUR", 400.0), MID_BRAND), "cheapest real powder, 400 g");
        assertNotNull(ValueScoreCalculator.score(2890.0, creatine("RSD", 500.0), MID_BRAND), "Ostrovit 500 g, 5.78 RSD/g");
    }
}
