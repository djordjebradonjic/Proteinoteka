package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Names are real listing titles taken from the stores' creatine categories (2026-09-19). */
class CreatineParserTest {

    private static CreatineParser.Info parse(String name) {
        return CreatineParser.parse(name, null);
    }

    // ------------------------------------------------------------------ form

    @Test
    void capsulesAreDetectedFromTheTitleAndCounted() {
        CreatineParser.Info i = parse("OLIMP KRE-ALKALYN 2500 MEGA CAPS, 120 kapsula");
        assertEquals(ProductForm.CAPSULE, i.form());
        assertEquals(120, i.unitCount());
        assertEquals("buffered", i.type());
        assertNull(i.packageGrams(), "2500 is a milligram dose, not a pack weight");
    }

    @Test
    void servingsAndCapsuleCountAreKeptApart() {
        CreatineParser.Info i = parse("Beta-K – Ultimate Nutrition, 50 porcija (200 kapsula)");
        assertEquals(ProductForm.CAPSULE, i.form());
        assertEquals(50, i.servings());
        assertEquals(200, i.unitCount());
    }

    @Test
    void sachetPackIsStillAPowderWithAUnitCountAndWeight() {
        CreatineParser.Info i = parse("IronFuel Creatine Monohydrate, 30 kesica (150g)");
        assertEquals(ProductForm.POWDER, i.form());
        assertEquals(30, i.unitCount());
        assertEquals(150.0, i.packageGrams());
        assertEquals("monohydrate", i.type());
    }

    @Test
    void shotInASachetPackStaysAPowder() {
        assertEquals(ProductForm.POWDER, parse("Crea Shot 2.0 – ActivLab, 20 kesica").form());
    }

    @Test
    void gummiesAreDetected() {
        CreatineParser.Info i = parse("Weider mikronizirani kreatin gumeni bomboni 60 bombona");
        assertEquals(ProductForm.GUMMY, i.form());
        assertEquals(60, i.unitCount());
        assertEquals("monohydrate", i.type(), "micronized creatine is monohydrate");
    }

    @Test
    void tabletsAreDetected() {
        assertEquals(ProductForm.TABLET, parse("Creatine 1000 mg, 90 tableta").form());
    }

    @Test
    void plainTitleDefaultsToPowder() {
        assertEquals(ProductForm.POWDER, parse("Creatine Monohydrate Basic – Nutriversum").form());
    }

    @Test
    void dosingRemarkInTheDescriptionDoesNotTurnAPowderIntoCapsules() {
        CreatineParser.Info i = CreatineParser.parse("Creatine Monohydrate 500g", "Uzimajte 3 kapsule dnevno ili 5 g praha.");
        assertEquals(ProductForm.POWDER, i.form());
    }

    @Test
    void bigPackCountInTheDescriptionSettlesAnUnlabelledTitle() {
        CreatineParser.Info i = CreatineParser.parse("Creatine Beta", "Pakovanje sadrži 120 kapsula.");
        assertEquals(ProductForm.CAPSULE, i.form());
        assertEquals(120, i.unitCount());
    }

    // ------------------------------------------------------------------ type

    @Test
    void creapureIsNotDoubleCountedAsAMonohydrateBlend() {
        assertEquals("creapure", parse("Creatine Germany (Creapure®) – Extrifit / 60 porcija").type());
        assertEquals("creapure", parse("Creapure monohydrate 300g").type());
    }

    @Test
    void severalChemistriesMakeABlend() {
        assertEquals("blend", parse("Creatine Monohydrate + HCl 300g").type());
        assertEquals("blend", parse("Mješavina kreatina 500g").type());
    }

    @Test
    void singleChemistries() {
        assertEquals("monohydrate", parse("USN MICRONIZED CREATINE, 500g").type());
        assertEquals("hcl", parse("Creatine HCl 120 kapsula").type());
        assertEquals("malate", parse("Tri-Creatine Malate 300g").type());
        assertEquals("buffered", parse("Kre-Alkalyn OneRaw® – Zoomad Labs, 75 porcija").type());
    }

    @Test
    void unknownTypeStaysNullInsteadOfGuessing() {
        assertNull(parse("CreGAAtine, 60 kesica").type());
        assertNull(parse("Creatine Powder Super – ActivLab, 83 porcije").type());
    }

    // ------------------------------------------------------------------ weight

    @Test
    void packageWeightVariants() {
        assertEquals(500.0, CreatineParser.packageGrams("USN MICRONIZED CREATINE, 500g"));
        assertEquals(1000.0, CreatineParser.packageGrams("Creatine 1kg"));
        assertEquals(1000.0, CreatineParser.packageGrams("Creatine 1.000 g"), "thousands separator, not 1 g");
        assertEquals(2270.0, CreatineParser.packageGrams("Creatine 2,27 kg"));
        assertEquals(250.0, CreatineParser.packageGrams("Creatine 250 gr"));
        assertNull(CreatineParser.packageGrams("Creatine 5000mg 120 kapsula"));
        assertNull(CreatineParser.packageGrams("CreaMASS – Yamamoto, 147 porcija"));
    }

    // ------------------------------------------------------------------ servings

    @Test
    void servingsFromTitle() {
        assertEquals(133, parse("Creatine Monohydrate – Genius Nutrition, 133 porcije").servings());
        assertEquals(88, parse("Creatine Powder Micronized – Optimum Nutrition / 88 porcija").servings());
    }

    @Test
    void twoPackSizesInOneTitleGiveNoServings() {
        assertNull(parse("Creatine Monohydrate Basic – Nutriversum / 60 i 100 porcija").servings());
        assertNull(parse("Creatine – Naughty Boy, 60 i 90 porcija").servings());
    }

    @Test
    void servingsFromDescriptionNeedAnExplicitPackStatement() {
        assertEquals(60, CreatineParser.servingsFromDescription("Sadrži 60 doza po pakovanju."));
        assertEquals(100, CreatineParser.servingsFromDescription("Broj doza: 100"));
        assertNull(CreatineParser.servingsFromDescription("Uzimajte 1 doza dnevno."), "a dosing remark is not a pack size");
    }

    @Test
    void descriptionListingSeveralPackSizesIsNeverReadAsThePackSizeOfOneVariant() {
        String description = "<p>Dostupan je u pakovanjima od 300 g i 500 g, sa dozom od 5 g po porciji, "
                + "što odgovara 60, odnosno 100 porcija po pakovanju.</p>";

        CreatineParser.Info small = CreatineParser.parse("Creatine Monohydrate Basic – Nutriversum / 60 i 100 porcija 300g", description);
        assertEquals(60, small.servings(), "300 g ÷ 5 g, not the 100 that the text also mentions");
        assertEquals(5.0, small.gramsPerServing());

        CreatineParser.Info large = CreatineParser.parse("Creatine Monohydrate Basic – Nutriversum / 60 i 100 porcija 500g", description);
        assertEquals(100, large.servings());

        assertNull(CreatineParser.parse("Creatine Monohydrate Basic – Nutriversum / 60 i 100 porcija", description).servings(),
                "no pack weight to derive from and the text is ambiguous");
    }

    @Test
    void servingsAreDerivedFromWeightAndDoseOnlyForPowders() {
        assertEquals(60, CreatineParser.parse("Creatine 300g", "Porcija: 5 g").servings());
        assertNull(CreatineParser.parse("Creatine caps 300g", "Porcija: 5 g").servings(),
                "a capsule pack's gram weight says little about how many servings it holds");
        assertNull(CreatineParser.parse("Creatine 300g", "Kreatin je odličan.").servings(), "no dose, no derivation");
    }

    // ------------------------------------------------------------------ dose

    @Test
    void dosePerServing() {
        assertEquals(5.0, CreatineParser.gramsPerServing("Preporučena doza je 5 g kreatina po porciji."));
        assertEquals(3.0, CreatineParser.gramsPerServing("Porcija: 3 g (1 mjerica)"));
        assertEquals(5.0, CreatineParser.gramsPerServing("Sadrži 5000 mg kreatina monohidrata."));
        assertEquals(5.0, CreatineParser.gramsPerServing("Serving size 5 g"));
        assertNull(CreatineParser.gramsPerServing("Kreatin je najbolje proučen suplement."));
        assertNull(CreatineParser.gramsPerServing("Porcija: 80 g"), "80 g is a protein-sized serving, not a creatine dose");
    }

    // ------------------------------------------------------------------ enrich

    @Test
    void enrichFillsOnlyMissingFields() {
        Product p = new Product();
        p.setName("Creatine Monohydrate Basic – Nutriversum");
        p.setDescription("<p>Porcija: 5 g. Sadrži 100 doza po pakovanju.</p>");
        p.setCreatineType("hcl"); // already known — must not be overwritten

        CreatineParser.enrich(p, "60 porcija");

        assertEquals("powder", p.getProductForm());
        assertEquals("hcl", p.getCreatineType());
        assertEquals(5.0, p.getCreatineGramsPerServing());
        assertEquals(60, p.getServingsPerContainer(), "the variant label is read together with the name");
    }
}
