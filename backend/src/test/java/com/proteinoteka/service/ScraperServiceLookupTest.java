package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.BrandReputationRepository;
import com.proteinoteka.repository.PriceHistoryRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.service.producttype.CreatineProfile;
import com.proteinoteka.util.PriceParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * How {@code saveOrUpdateProduct} finds the stored row of an item whose URL it has not seen. Some stores
 * publish several products under one generic title and weight (SupplementStore: "Creatine Monohydrate,
 * 300g" from three brands); that used to throw and abort the whole listing.
 */
class ScraperServiceLookupTest {

    private ProductRepository productRepository;
    private ScraperService service;
    private final Store store = new Store();
    private final CreatineProfile profile = new CreatineProfile();

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        store.setName("SupplementStore");
        store.setCurrency("RSD");
        store.setMarket("rs");
        service = new ScraperService(productRepository, null, List.of(), mock(PriceHistoryRepository.class),
                new PriceParser(), mock(BrandReputationRepository.class), null, null, null, null,
                mock(ProductGroupService.class), null, null, null, null);
        when(productRepository.findByUrl(anyString())).thenReturn(Optional.empty());
    }

    private static Product row(long id, String url, double price) {
        Product p = new Product();
        p.setId(id);
        p.setName("Creatine Monohydrate, 300g");
        p.setUrl(url);
        p.setNumericPrice(price);
        p.setPrice(String.valueOf(price));
        p.setProductType("creatine");
        p.setPrimaryWeightGrams(300.0);
        return p;
    }

    private static Product scraped(String url, String price) {
        Product p = new Product();
        p.setName("Creatine Monohydrate, 300g");
        p.setUrl(url);
        p.setPrice(price);
        p.setPrimaryWeightGrams(300.0);
        return p;
    }

    @Test
    void severalRowsWithTheSameTitleAndWeightBecomeANewProductInsteadOfThrowing() {
        Product first = row(1, "https://s/a", 2400);
        Product second = row(2, "https://s/b", 2880);
        when(productRepository.findAllByNameAndStoreAndWeight(anyString(), eq(store), anyDouble(), eq("creatine")))
                .thenReturn(List.of(first, second));
        Product incoming = scraped("https://s/c", "2190");

        boolean saved = service.saveOrUpdateProduct(incoming, store, new HashSet<>(), profile, true);

        assertTrue(saved);
        verify(productRepository).save(incoming);
        assertEquals("https://s/a", first.getUrl(), "an existing row must not be hijacked");
        assertEquals("https://s/b", second.getUrl());
        verify(productRepository, never()).findByStoreAndWeight(any(), anyDouble(), anyString());
    }

    // The one-match case is the SKU-changed re-point that existed before: unchanged.
    @Test
    void aSingleMatchWithASimilarPriceIsStillRepointed() {
        Product only = row(1, "https://s/old", 2190);
        when(productRepository.findAllByNameAndStoreAndWeight(anyString(), eq(store), anyDouble(), eq("creatine")))
                .thenReturn(List.of(only));
        Set<Long> claimed = new HashSet<>();

        boolean saved = service.saveOrUpdateProduct(scraped("https://s/new", "2190"), store, claimed, profile, true);

        assertTrue(saved);
        assertEquals("https://s/new", only.getUrl());
        verify(productRepository).save(only);
    }
}
