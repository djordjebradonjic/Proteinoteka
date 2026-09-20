package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.service.producttype.CreatineProfile;
import com.proteinoteka.service.producttype.ProteinProfile;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ListingFamilyTest {

    private final BaseScraperEnricher baseEnricher = new BaseScraperEnricher(null);

    private static Product named(String name) {
        Product p = new Product();
        p.setName(name);
        return p;
    }

    // The 2/3-argument scrape() overloads keep the store's original protein rule untouched.
    @Test
    void legacyProteinEntryPointUsesTheStoresOwnRule() {
        assertTrue(ListingFamily.PROTEIN.rejectReason(named("Creatine Caps 120 kapsula"), baseEnricher).isPresent());
        assertTrue(ListingFamily.PROTEIN.rejectReason(named("Whey Protein 900g"), baseEnricher).isEmpty());
        assertFalse(ListingFamily.PROTEIN.isCreatine());
    }

    @Test
    void creatineFamilyUsesTheCreatineProfileAndTheTargetsTrust() {
        ListingTarget trusted = ListingTarget.html("creatine", "https://x/kreatin", p -> "https://x/kreatin");
        ListingTarget mixed = ListingTarget.html("creatine", "https://x/kreatin", p -> "https://x/kreatin", false);
        CreatineProfile profile = new CreatineProfile();

        // "Krealka" has no creatine keyword: fine inside a creatine category, not inside a mixed one
        assertTrue(ListingFamily.of(trusted, profile)
                .rejectReason(named("Krealka MAX (Krealkalin) 120cap - Superior"), baseEnricher).isEmpty());
        assertTrue(ListingFamily.of(mixed, profile)
                .rejectReason(named("THE Electrofuel"), baseEnricher).isPresent());
        assertTrue(ListingFamily.of(trusted, profile).isCreatine());
    }

    @Test
    void proteinTargetKeepsTheProteinRule() {
        ListingTarget protein = ListingTarget.html("protein", "https://x/proteini", p -> "https://x/proteini");
        ListingFamily family = ListingFamily.of(protein, new ProteinProfile(baseEnricher));

        assertTrue(family.rejectReason(named("Serious Mass 5.4kg"), baseEnricher).isPresent());
        assertTrue(family.rejectReason(named("Whey Protein 900g"), baseEnricher).isEmpty());
        assertFalse(family.isCreatine());
    }
}
