package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class CreatineProfileTest {

    private final CreatineProfile profile = new CreatineProfile();

    private static Product named(String name) {
        Product p = new Product();
        p.setName(name);
        p.setProductType(ProductTypes.CREATINE);
        return p;
    }

    // ------------------------------------------------------------------ acceptance

    @Test
    void noiseInsideACreatineCategoryIsRejected() {
        for (String name : new String[]{
                "PhD Pre-Workout Burn",
                "Back to Gym XXL paket",
                "DY Nutrition Shadowhey Isolate 2kg",
                "DY Nutrition Multivitamin Complex, 60 tableta",
                "Verviavita Creatine Monohydrate 900g 2+1 gratis",
                "Whey Protein 2kg + Creatine 300g"}) {
            assertTrue(profile.rejectReason(named(name), true).isPresent(), name);
        }
    }

    // Real titles from the HTML stores' creatine categories (fitlab.rs, proteini.si/hr, myprotein.rs/.hr, 2026-09-20)
    @Test
    void bundlesAndOtherFamiliesSeenInHtmlStoreCategoriesAreRejected() {
        for (String name : new String[]{
                "Supernova 258g/30serv - BioTechUSA",
                "BATTERY CREATINE (FLAVOURED) - 1+1 PACK (-20%)",
                "BATTERY CREATINE - POWER & RECHARGE, LIMITED PACK",
                "MAX Promo Paket - Maximalium",
                "Whey Isolate 2kg + Creatin 300g - 5stars/Body Attack",
                "CreaPOWDER 500g + BCAA 8:1:1 300g - Yamamoto",
                "Creatine Monohydrate 500g (+Citrulin/ Beta-alanin/ Taurin/ Arginin) - Maximalium",
                "Paket Gainer"}) {
            assertTrue(profile.rejectReason(named(name), true).isPresent(), name);
        }
    }

    @Test
    void creatineProductsWithUnusualNamesSeenInHtmlStoreCategoriesAreAccepted() {
        for (String name : new String[]{
                "Krealka MAX (Krealkalin) 120cap - Superior",
                "Creafast 120 tableta",
                "CREAPOWDER 500G - YAMAMOTO NUTRITION",
                "Myprotein, Impact Creatine Stick Packs, 6g (Boxes)",
                "Krea-Genic Maximum 554g/70serv - Weider",
                "Beta K 200cap - Ultimate Nutrition",
                "VAST CREATINE ULTRA PURE CAPS, 300 kapsula"}) {
            assertTrue(profile.rejectReason(named(name), true).isEmpty(), name);
        }
    }

    // Carbohydrate mixes sold under a creatine name cost 0.015-0.022 EUR/g, the same as GymBeam's real
    // 100% creatine in 1-1.5 kg bags, so the price cannot tell them apart: the name has to.
    @Test
    void carbohydrateMixesAreRejectedButBulkPureCreatineIsNot() {
        for (String name : new String[]{
                "Kreatin + Dekstroza - GymBeam",
                "Creatine + Dextrose 1 kg",
                "NUTREND CREAPORT, 600g ORANGE FLAVOUR",
                "Amix VitarGO + Kre-Alkalyn 2 kg",
                "Creatine with Maltodextrin 500g",
                "USN CREATINE ANABOLIC 5000, 900g"}) {
            assertTrue(profile.rejectReason(named(name), true).isPresent(), name);
        }
        for (String name : new String[]{
                "100% Kreatin Monohidrat - GymBeam",
                "Creatine Monohydrate 1000g",
                "Kreatin Monohidrat Creapure 500g",
                "Anabolic Crea 10, 207g"}) {
            assertTrue(profile.rejectReason(named(name), true).isEmpty(), name);
        }
    }

    // MyProtein files an electrolyte drink and a vitamin pack under its creatine category.
    @Test
    void mixedCategoryItemsWithoutACreatineKeywordAreRejected() {
        for (String name : new String[]{"THE Electrofuel", "THE ElectroPower", "Paket Vitamina"}) {
            assertTrue(profile.rejectReason(named(name), false).isPresent(), name);
        }
        for (String name : new String[]{
                "Impact Creatine - aroma lizalica Chupa Chups sa ukusom lubenice",
                "Kreatin Monohidrat Elite",
                "Kreatin Gumije",
                "Kremaste žvakaće bombone s kreatinom bez šećera",
                "THE Creatine | Creapure® tablete za žvakanje",
                "Myprotein PRO Creapure Stick Pack (Sample)"}) {
            assertTrue(profile.rejectReason(named(name), false).isEmpty(), name);
        }
    }

    @Test
    void gainersPreWorkoutsAndArginineFiledUnderCreatineAreRejected() {
        // real titles from the "kreatin" category of nutrition-shop.hr, 2026-09-19
        for (String name : new String[]{
                "MUSCLETECH MASS TECH Performance series, 3180g",
                "OPTIMUM GOLD STANDARD PRE-WORK OUT, 330g",
                "OLIMP ARGI POWER 1500, 120 kapsula",
                "Serious Mass 5.4kg"}) {
            assertTrue(profile.rejectReason(named(name), true).isPresent(), name);
        }
        for (String name : new String[]{
                "OLIMP CREATINE MONOHYDRATE POWDER,250g",
                "IRONMAXX KREA7 SUPERALKALIN, 180 tableta",
                "NUTREND CREATINE MONOHYDRATE, 300g",
                "Creatine Monohydrate kapsule"}) {
            assertTrue(profile.rejectReason(named(name), true).isEmpty(), name);
        }
    }

    @Test
    void brandCoinedCreatineNamesAreAcceptedInsideTheCategory() {
        for (String name : new String[]{
                "CreaMASS – Yamamoto, 147 porcija",
                "CREA-F7 – Genius Nutrition, 45 porcija",
                "Crea Pro – Basic Supplements / 200 porcija",
                "CreGAAtine, 60 kesica",
                "Kre-Alkalyn OneRaw® – Zoomad Labs, 75 porcija",
                "Beta-K – Ultimate Nutrition, 50 porcija (200 kapsula)"}) {
            assertTrue(profile.rejectReason(named(name), true).isEmpty(), name);
        }
    }

    @Test
    void storeBrandContainingProteinIsNotMistakenForProtein() {
        assertTrue(profile.rejectReason(named("PROTEINI.SI 100% PURE CREATINE, 200g"), true).isEmpty());
    }

    @Test
    void outsideACreatineCategoryTheNameMustSayCreatine() {
        assertTrue(profile.rejectReason(named("Creatine Monohydrate 500g"), false).isEmpty());
        assertTrue(profile.rejectReason(named("Kreatin monohidrat kapsule"), false).isEmpty());
        assertTrue(profile.rejectReason(named("CreaMASS – Yamamoto, 147 porcija"), false).isPresent());

        Product withDose = named("CreaMASS – Yamamoto, 147 porcija");
        withDose.setCreatineGramsPerServing(5.0);
        assertTrue(profile.rejectReason(withDose, false).isEmpty(), "a parsed dose is confirmation enough");
    }

    @Test
    void blankNameIsRejected() {
        assertTrue(profile.rejectReason(named(" "), true).isPresent());
        assertTrue(profile.rejectReason(named(null), true).isPresent());
    }

    // ------------------------------------------------------------------ sanitize

    @Test
    void sanitizeParsesFormAndDropsImplausibleDose() {
        Product p = named("Creatine Caps, 120 kapsula");
        p.setCreatineGramsPerServing(45.0);
        p.setServingsPerContainer(5000);

        profile.sanitize(p, "TestStore");

        assertEquals("capsule", p.getProductForm());
        assertEquals(120, p.getUnitCount());
        assertNull(p.getCreatineGramsPerServing(), "45 g is not a creatine dose");
        assertNull(p.getServingsPerContainer());
    }

    // ------------------------------------------------------------------ sachet packs

    // Store scrapers take the first gram figure of a title as the pack weight; in "(5g Kesica) 20kesica"
    // that figure is ONE sachet (FitLab stored the pack as 5 g).
    @Test
    void aSachetWeightIsNotThePackWeight() {
        Product p = named("CREA PRO - Kreatin (5g Kesica) 20kesica - Basic Supplements");
        p.getPackage_weight().add("5g");
        p.setPrimaryWeightGrams(5.0);

        profile.sanitize(p, "TestStore");

        assertEquals(List.of("100g"), p.getPackage_weight(), "20 sachets of 5 g");
        assertEquals(100.0, p.getPrimaryWeightGrams());
        assertEquals(20, p.getUnitCount());
    }

    @Test
    void withoutASachetCountThePackWeightIsUnknownRatherThanOneSachet() {
        Product p = named("BS CreaPro 5g kesice");
        p.getPackage_weight().add("5g");
        p.setPrimaryWeightGrams(5.0);

        profile.sanitize(p, "TestStore");

        assertTrue(p.getPackage_weight().isEmpty());
        assertNull(p.getPrimaryWeightGrams());
    }

    @Test
    void aStatedPackWeightBesideTheSachetWeightIsLeftAlone() {
        Product p = named("CREA PRO -Kreatin /100 grama (5g Kesica) BASIC SUPPLEMENTS");
        p.getPackage_weight().add("100g");
        p.getPackage_weight().add("5g");
        p.setPrimaryWeightGrams(100.0);

        profile.sanitize(p, "TestStore");

        assertEquals(List.of("100g", "5g"), p.getPackage_weight());
        assertEquals(100.0, p.getPrimaryWeightGrams());
    }

    @Test
    void aTitleWithoutASachetWeightKeepsItsWeight() {
        Product p = named("Creatine Monohydrate 300g");
        p.getPackage_weight().add("300g");
        p.setPrimaryWeightGrams(300.0);

        profile.sanitize(p, "TestStore");

        assertEquals(List.of("300g"), p.getPackage_weight());
        assertEquals(300.0, p.getPrimaryWeightGrams());
    }

    @Test
    void aServingAboveTheLoadingPhaseTotalIsAMixedProductNotACreatineDose() {
        // Nutrend Creaport (creatine + carbohydrates) was parsed as a 30 g dose
        Product mix = named("NUTREND CREAPORT, 600g ORANGE FLAVOUR");
        mix.setCreatineGramsPerServing(30.0);
        Product loading = named("Creatine Monohydrate 500g");
        loading.setCreatineGramsPerServing(20.0);

        profile.sanitize(mix, "TestStore");
        profile.sanitize(loading, "TestStore");

        assertNull(mix.getCreatineGramsPerServing());
        assertEquals(20.0, loading.getCreatineGramsPerServing());
    }

    // ------------------------------------------------------------------ merge / completeness / price

    @Test
    void mergeDoesNotLetAListingOnlyPowderDefaultOverwriteALearnedCapsuleForm() {
        Product stored = named("Creatine Beta");
        stored.setProductForm("capsule");
        Product listingOnly = named("Creatine Beta");
        listingOnly.setProductForm("powder");

        profile.mergeInto(stored, listingOnly);

        assertEquals("capsule", stored.getProductForm());
    }

    @Test
    void mergeFillsGapsButKeepsKnownDose() {
        Product stored = named("Creatine");
        stored.setCreatineGramsPerServing(5.0);
        Product fresh = named("Creatine");
        fresh.setCreatineGramsPerServing(3.0);
        fresh.setServingsPerContainer(60);
        fresh.setCreatineType("monohydrate");
        fresh.setUnitCount(60);

        profile.mergeInto(stored, fresh);

        assertEquals(5.0, stored.getCreatineGramsPerServing());
        assertEquals(60, stored.getServingsPerContainer());
        assertEquals("monohydrate", stored.getCreatineType());
        assertEquals(60, stored.getUnitCount());
    }

    @Test
    void detailIsCompleteOnceTheParserHasRun() {
        Product p = named("Creatine");
        assertFalse(profile.isDetailComplete(p, false));
        p.setProductForm("powder");
        assertTrue(profile.isDetailComplete(p, false));
    }

    @Test
    void priceFloorPerCurrency() {
        assertEquals(500.0, profile.minPrice("RSD"));
        assertEquals(4.0, profile.minPrice("EUR"));
    }

    @Test
    void restoreNeverBlocksStorage() {
        assertTrue(profile.restoreFromStored(named("Creatine"), Optional.empty(), "TestStore"));
    }
}
