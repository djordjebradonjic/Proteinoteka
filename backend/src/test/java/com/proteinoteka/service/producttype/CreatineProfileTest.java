package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

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
