package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.ProductGroup;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static com.proteinoteka.service.ProductGroupServiceTest.group;
import static com.proteinoteka.service.ProductGroupServiceTest.product;
import static com.proteinoteka.service.ProductGroupServiceTest.store;
import static org.junit.jupiter.api.Assertions.*;

class ProductGroupAuditTest {

    private static Product member(long groupId, String name, String brand, double grams, String source, long storeId, Double protein) {
        Product p = product(name, brand, grams, source, store(storeId, "Store" + storeId));
        p.setGroupId(groupId);
        p.setProteinPer100g(protein);
        return p;
    }

    private static boolean has(List<String> issues, String code) {
        return issues.stream().anyMatch(i -> i.startsWith(code));
    }

    @Test
    void cleanGroupHasNoIssues() {
        ProductGroup g = group(1, "USN", 908);
        List<Product> ps = List.of(
                member(1, "USN Blue Lab 908g", "USN", 908, "whey_concentrate", 1, 75.0),
                member(1, "USN BLUE LAB 100% WHEY PROTEIN, 908G", "USN", 910, "whey_concentrate", 2, 76.0));
        assertEquals(List.of(), ProductGroupAudit.run(List.of(g), ps));
    }

    @Test
    void wrongBrandMemberIsFlagged() {
        ProductGroup g = group(1, "ExtriFit", 2000);
        List<Product> ps = List.of(
                member(1, "100% Whey protein 2kg - ExtriFit", "ExtriFit", 2000, "whey_concentrate", 1, 75.0),
                member(1, "Extrifit 100% Whey Protein 2000g", "ExtriFit", 2000, "whey_concentrate", 2, 75.0),
                member(1, "Gold Whey Protein, 2kg", "Kevin Levrone", 2000, "whey_concentrate", 3, 76.0));
        assertTrue(has(ProductGroupAudit.run(List.of(g), ps), "GROUP_MIXED_BRAND"));
    }

    @Test
    void mixedPackSizesAndStaleWeightAreFlagged() {
        ProductGroup g = group(1, "Optimum Nutrition", 2270);
        List<Product> ps = List.of(
                member(1, "Gold Standard Whey 2270g", "Optimum Nutrition", 2270, "whey_concentrate", 1, 80.0),
                member(1, "100% Whey Gold Standard", "Optimum Nutrition", 2020, "whey_concentrate", 2, 75.0));
        List<String> issues = ProductGroupAudit.run(List.of(g), ps);
        assertTrue(has(issues, "GROUP_WEIGHT_SPREAD"), issues.toString());
        assertTrue(has(issues, "GROUP_STALE_METADATA"), issues.toString());
    }

    // ------------------------------------------------------------------ counted forms

    private static Product capsules(Long groupId, String name, int units, long storeId) {
        Product p = ProductGroupServiceTest.pieces(name, "Amix Nutrition", "capsule", units, store(storeId, "Store" + storeId));
        p.setGroupId(groupId);
        return p;
    }

    @Test
    void aCleanCapsuleGroupIsMeasuredInPiecesAndHasNoIssues() {
        ProductGroup g = group(1, "Amix Nutrition", 120);
        List<Product> ps = List.of(
                capsules(1L, "Kre-Alkalyn 120cap - Amix", 120, 1),
                capsules(1L, "Kre-alkalyn 120 kapsula AMIX", 120, 2));
        assertEquals(List.of(), ProductGroupAudit.run(List.of(g), ps));
    }

    @Test
    void differentCapsuleCountsInOneGroupAreFlaggedInPieces() {
        ProductGroup g = group(1, "Amix Nutrition", 120);
        List<Product> ps = List.of(
                capsules(1L, "Kre-Alkalyn 120cap - Amix", 120, 1),
                capsules(1L, "Kre-alkalyn 110 kapsula AMIX", 110, 2));
        List<String> issues = ProductGroupAudit.run(List.of(g), ps);
        assertTrue(issues.stream().anyMatch(i -> i.startsWith("GROUP_WEIGHT_SPREAD") && i.contains("pcs")), issues.toString());
    }

    @Test
    void ungroupedCreatineThatFitsAGroupIsReported() {
        ProductGroup g = group(1, "Amix Nutrition", 120);
        List<Product> ps = new ArrayList<>(List.of(
                capsules(1L, "Kre-Alkalyn 120cap - Amix", 120, 1),
                capsules(1L, "Kre-alkalyn 120 kapsula AMIX", 120, 2)));
        ps.add(capsules(null, "AMIX KreAlkalyn 120 kapsula", 120, 3));

        List<String> issues = ProductGroupAudit.run(List.of(g), ps);
        assertTrue(has(issues, "UNGROUPED_MATCH"), issues.toString());
    }

    @Test
    void singleMemberAndSameStoreAreFlagged() {
        ProductGroup lonely = group(1, "Amix", 2200);
        ProductGroup twice = group(2, "USN", 908);
        List<Product> ps = new ArrayList<>(List.of(
                member(1, "Monster Beef 2.2kg", "Amix", 2200, "beef", 1, 90.0),
                member(2, "USN Blue Lab 908g", "USN", 908, "whey_concentrate", 1, 75.0),
                member(2, "USN Blue Lab 908g chocolate", "USN", 908, "whey_concentrate", 1, 75.0)));
        List<String> issues = ProductGroupAudit.run(List.of(lonely, twice), ps);
        assertTrue(has(issues, "GROUP_TOO_SMALL"));
        assertTrue(has(issues, "GROUP_SAME_STORE"));
    }

    @Test
    void proteinOutlierMemberIsFlaggedWithTheLikelyValue() {
        ProductGroup g = group(1, "Maximalium", 750);
        List<Product> ps = List.of(
                member(1, "Izolat whey protein 750g - Maximalium", "Maximalium", 750, "whey_isolate", 1, 94.0),
                member(1, "Isolate Whey Protein – Maximalium", "Maximalium", 750, "whey_isolate", 2, 91.07),
                member(1, "Isolate Whey Protein 100%, 750g", "Maximalium", 750, "whey_isolate", 3, 30.0));
        List<String> issues = ProductGroupAudit.run(List.of(g), ps);
        assertTrue(issues.stream().anyMatch(i -> i.startsWith("GROUP_PROTEIN_OUTLIER") && i.contains("30.0%") && i.contains("93")
                || i.startsWith("GROUP_PROTEIN_OUTLIER") && i.contains("30.0%")), issues.toString());
    }

    @Test
    void twoMemberGroupWithHugeProteinGapIsFlagged() {
        ProductGroup g = group(1, "Maximalium", 750);
        List<Product> ps = List.of(
                member(1, "Isolate Whey Protein – Maximalium", "Maximalium", 750, "whey_isolate", 1, 91.0),
                member(1, "Isolate Whey Protein 100%, 750g", "Maximalium", 750, "whey_isolate", 2, 30.0));
        assertTrue(has(ProductGroupAudit.run(List.of(g), ps), "GROUP_PROTEIN_OUTLIER"));
    }

    @Test
    void conflictingProductLineIsFlaggedButGenericOrFlavourOnlyNamesAreNot() {
        ProductGroup bad = group(1, "Ultimate Nutrition", 910);
        List<Product> conflict = List.of(
                member(1, "Iso Sensation 93 910g", "Ultimate Nutrition", 910, "whey_isolate", 1, 93.0),
                member(1, "Iso Sensation 93 (Isolate)", "Ultimate Nutrition", 910, "whey_isolate", 2, 93.0),
                member(1, "Clean Whey 910g", "Ultimate Nutrition", 910, "whey_isolate", 3, 92.0));
        assertTrue(has(ProductGroupAudit.run(List.of(bad), conflict), "GROUP_NAME_MISMATCH"));

        ProductGroup ok = group(2, "BioTech USA", 908);
        List<Product> generic = List.of(
                member(2, "Iso Whey Zero 908 g", "BioTech USA", 908, "whey_isolate", 1, 85.0),
                member(2, "Iso whey zero (Catalan caramel cream) 908g", "BioTech USA", 908, "whey_isolate", 2, 83.0));
        assertFalse(has(ProductGroupAudit.run(List.of(ok), generic), "GROUP_NAME_MISMATCH"));
    }

    @Test
    void duplicateGroupsForTheSameProductAreFlaggedButDifferentLinesAreNot() {
        ProductGroup a = group(1, "BioTech USA", 4000), b = group(2, "BioTech USA", 4000);
        List<Product> dup = List.of(
                member(1, "Biotech Protein Power 4000 g", "BioTech USA", 4000, "blend", 1, 81.0),
                member(1, "Power protein 4kg - BioTechUSA", "BioTech USA", 4000, "blend", 2, 81.0),
                member(2, "BioTech Power Protein", "BioTech USA", 4000, "blend", 3, 86.0),
                member(2, "Protein Power", "BioTech USA", 4000, "blend", 4, 86.0));
        assertTrue(has(ProductGroupAudit.run(List.of(a, b), dup), "DUPLICATE_GROUPS"));

        ProductGroup sens = group(3, "Ultimate Nutrition", 910), cool = group(4, "Ultimate Nutrition", 907);
        List<Product> lines = List.of(
                member(3, "Iso Sensation 93 910g", "Ultimate Nutrition", 910, "whey_isolate", 1, 93.0),
                member(3, "Ultimate Nutrition IsoSensation 93", "Ultimate Nutrition", 910, "whey_isolate", 2, 93.0),
                member(3, "Iso Sensation 93 (Isolate), 910g", "Ultimate Nutrition", 910, "whey_isolate", 3, 93.0),
                member(4, "Iso Cool 908g", "Ultimate Nutrition", 908, "whey_isolate", 1, 88.0),
                member(4, "Iso Cool (Isolate), 907g", "Ultimate Nutrition", 907, "whey_isolate", 4, 88.0));
        assertFalse(has(ProductGroupAudit.run(List.of(sens, cool), lines), "DUPLICATE_GROUPS"));
    }

    @Test
    void ungroupedListingThatFitsAGroupIsReported() {
        ProductGroup g = group(1, "Ultimate Nutrition", 2270);
        List<Product> ps = new ArrayList<>(List.of(
                member(1, "Iso Sensation 93 2.27kg", "Ultimate Nutrition", 2270, "whey_isolate", 1, 93.0),
                member(1, "Iso Sensation 93 - 2270g", "Ultimate Nutrition", 2270, "whey_isolate", 2, 93.0)));
        Product orphan = product("Ultimate Nutrition IsoSensation 93 (2.3 kg)", "Ultimate Nutrition", 2300, "whey_isolate", store(9, "XSport"));
        ps.add(orphan);
        assertTrue(has(ProductGroupAudit.run(List.of(g), ps), "UNGROUPED_MATCH"));
    }
}
