package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.ProductGroup;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.ProductGroupRepository;
import com.proteinoteka.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProductGroupServiceTest {

    @Mock ProductRepository productRepository;
    @Mock ProductGroupRepository productGroupRepository;
    ProductGroupService service;

    private static long ids = 1;

    @BeforeEach
    void setUp() {
        service = new ProductGroupService(productRepository, productGroupRepository);
    }

    static Store store(long id, String name) {
        Store s = new Store();
        s.setId(id);
        s.setName(name);
        return s;
    }

    static Product product(String name, String brand, double grams, String source, Store store) {
        Product p = new Product();
        p.setId(ids++);
        p.setName(name);
        p.setBrand(brand);
        p.setPrimaryWeightGrams(grams);
        p.setProteinSource(source);
        p.setStore(store);
        p.setMarket("rs");
        return p;
    }

    static ProductGroup group(long id, String brand, double grams) {
        ProductGroup g = new ProductGroup();
        g.setId(id);
        g.setBrand(brand);
        g.setCanonicalName("g" + id);
        g.setWeightGrams(grams);
        g.setMarket("rs");
        return g;
    }

    // ------------------------------------------------------------------ fitsGroup

    @Test
    void differentPackSizesAreNotTheSameProduct() {
        // Optimum Gold Standard 2020g vs 2270g was grouped together (12% apart)
        ProductGroup g = group(1, "Optimum Nutrition", 2270);
        List<Product> members = List.of(product("OPTIMUM WHEY PROTEIN GOLD STANDARD, 2270g", "Optimum Nutrition", 2270, "whey_concentrate", store(1, "A")));
        Product outlet = product("100% Whey Gold Standard", "Optimum Nutrition", 2020, "whey_concentrate", store(2, "B"));
        assertFalse(ProductGroupService.fitsGroup(outlet, g, members));

        Product sameSize = product("100% Whey Gold Standard", "Optimum Nutrition", 2260, "whey_concentrate", store(2, "B"));
        assertTrue(ProductGroupService.fitsGroup(sameSize, g, members));
    }

    @Test
    void usesTheMembersRealAverageNotTheStoredGroupWeight() {
        // group says 1000g but members are 900g (the g196 case): a 900g listing must fit
        ProductGroup stale = group(1, "BioTech USA", 1000);
        List<Product> members = List.of(product("100% pure whey 900g - BioTechUSA", "BioTech USA", 900, "blend", store(1, "A")));
        Product p = product("BioTech 100% Pure Whey 900g", "BioTech USA", 900, "whey_concentrate", store(2, "B"));
        assertTrue(ProductGroupService.fitsGroup(p, stale, members));
    }

    @Test
    void differentBrandNeverFits() {
        // Kevin Levrone "Gold Whey" ended up in the ExtriFit group
        ProductGroup g = group(1, "ExtriFit", 2000);
        List<Product> members = List.of(product("100% Whey protein 2kg - ExtriFit", "ExtriFit", 2000, "whey_concentrate", store(1, "A")));
        Product levrone = product("Gold Whey Protein, 2kg", "Kevin Levrone", 2000, "whey_concentrate", store(2, "B"));
        assertFalse(ProductGroupService.fitsGroup(levrone, g, members));
    }

    @Test
    void oneListingPerStore() {
        Store a = store(1, "A");
        ProductGroup g = group(1, "USN", 908);
        List<Product> members = List.of(product("USN Blue Lab 908g", "USN", 908, "whey_concentrate", a));
        assertFalse(ProductGroupService.fitsGroup(product("USN Blue Lab 908g chocolate", "USN", 908, "whey_concentrate", a), g, members));
        assertTrue(ProductGroupService.fitsGroup(product("USN Blue Lab 908g", "USN", 908, "whey_concentrate", store(2, "B")), g, members));
    }

    @Test
    void differentProductLineOrProteinTypeDoesNotFit() {
        Store a = store(1, "A"), b = store(2, "B");
        ProductGroup g = group(1, "Ultimate Nutrition", 910);
        List<Product> sensation = List.of(product("Iso Sensation 93 910g", "Ultimate Nutrition", 910, "whey_isolate", a));
        assertFalse(ProductGroupService.fitsGroup(product("Iso Cool 908g", "Ultimate Nutrition", 908, "whey_isolate", b), g, sensation));
        assertTrue(ProductGroupService.fitsGroup(product("Ultimate Nutrition IsoSensation 93", "Ultimate Nutrition", 910, "whey_isolate", b), g, sensation));
        assertFalse(ProductGroupService.fitsGroup(product("Iso Sensation 93 910g", "Ultimate Nutrition", 910, "casein", b), g, sensation));
    }

    @Test
    void otherMarketNeverFits() {
        ProductGroup g = group(1, "USN", 908);
        List<Product> members = List.of(product("USN Blue Lab 908g", "USN", 908, "whey_concentrate", store(1, "A")));
        Product hr = product("USN Blue Lab 908g", "USN", 908, "whey_concentrate", store(2, "B"));
        hr.setMarket("hr");
        assertFalse(ProductGroupService.fitsGroup(hr, g, members));
    }

    // ------------------------------------------------------------------ groupingSource

    @Test
    void beefLabelledAsHydrolysateGroupsAsBeef() {
        Product a = product("Anabolic Monster Beef - Amix", "Amix Nutrition", 2200, "hydrolysate", store(1, "A"));
        Product b = product("Monster Beef Protein", "Amix Nutrition", 2200, "beef", store(2, "B"));
        assertEquals("beef", ProductGroupService.groupingSource(a));
        assertEquals(ProductGroupService.groupingSource(a), ProductGroupService.groupingSource(b));
    }

    @Test
    void blendAndConcentrateStayOneFamilyButIsolateIsSeparate() {
        assertEquals(ProductGroupService.groupingSource(product("Whey", "X", 1000, "blend", null)),
                ProductGroupService.groupingSource(product("Whey", "X", 1000, "whey_concentrate", null)));
        assertNotEquals(ProductGroupService.groupingSource(product("Shadowhey", "X", 1000, "whey_isolate", null)),
                ProductGroupService.groupingSource(product("Shadowhey", "X", 1000, "whey_concentrate", null)));
    }

    // ------------------------------------------------------------------ tryAutoAssign

    @Test
    void assignsToTheSingleFittingGroupAndRefreshesItsWeight() {
        ProductGroup g = group(7, "USN", 900);
        Product m = product("USN Blue Lab 908g", "USN", 908, "whey_concentrate", store(1, "A"));
        m.setGroupId(7L);
        when(productGroupRepository.findByBrandIgnoreCaseAndMarket("usn", "rs")).thenReturn(List.of(g));
        when(productRepository.findByGroupId(7L)).thenReturn(List.of(m));

        Product incoming = product("USN BLUE LAB 100% WHEY PROTEIN, 908G", "USN", 912, "whey_concentrate", store(2, "B"));
        service.tryAutoAssign(incoming);

        assertEquals(7L, incoming.getGroupId());
        verify(productRepository).save(incoming);
        assertEquals(910.0, g.getWeightGrams(), 0.01);
        verify(productGroupRepository).save(g);
    }

    @Test
    void ambiguousMatchIsLeftUnassigned() {
        // two duplicate groups for the same product (BioTech Power Protein g115/g242)
        ProductGroup g1 = group(1, "BioTech USA", 4000), g2 = group(2, "BioTech USA", 4000);
        Product m1 = product("Biotech Power Protein 4000 g", "BioTech USA", 4000, "blend", store(1, "A"));
        Product m2 = product("BioTech Power Protein", "BioTech USA", 4000, "blend", store(2, "B"));
        when(productGroupRepository.findByBrandIgnoreCaseAndMarket("biotech usa", "rs")).thenReturn(List.of(g1, g2));
        when(productRepository.findByGroupId(1L)).thenReturn(List.of(m1));
        when(productRepository.findByGroupId(2L)).thenReturn(List.of(m2));

        Product incoming = product("Protein Power", "BioTech USA", 4000, "blend", store(3, "C"));
        service.tryAutoAssign(incoming);

        assertNull(incoming.getGroupId());
        verify(productRepository, never()).save(any());
    }

    // ------------------------------------------------------------------ refreshGroupMetadata

    @Test
    void refreshFixesStaleWeightAndDissolvesSingleMemberGroups() {
        ProductGroup stale = group(1, "BioTech USA", 1000);
        ProductGroup lonely = group(2, "Amix", 2200);
        Product a = product("100% pure whey 900g", "BioTech USA", 900, "blend", store(1, "A"));
        Product b = product("BioTech 100% Pure Whey 900g", "BioTech USA", 900, "blend", store(2, "B"));
        Product alone = product("Monster Beef 2.2kg", "Amix", 2200, "beef", store(3, "C"));
        alone.setGroupId(2L);
        when(productGroupRepository.findAll()).thenReturn(List.of(stale, lonely));
        when(productRepository.findByGroupId(1L)).thenReturn(List.of(a, b));
        when(productRepository.findByGroupId(2L)).thenReturn(new ArrayList<>(List.of(alone)));

        Map<String, Object> result = service.refreshGroupMetadata();

        assertEquals(900.0, stale.getWeightGrams(), 0.01);
        assertNull(alone.getGroupId());
        verify(productGroupRepository).deleteById(2L);
        assertEquals(1, result.get("weightsUpdated"));
        assertEquals(1, result.get("groupsDissolved"));
    }
}
