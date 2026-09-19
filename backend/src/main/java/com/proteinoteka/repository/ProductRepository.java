package com.proteinoteka.repository;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Page<Product> findByStoreNameIgnoreCase(String storeName, Pageable pageable);

    void deleteByStore(Store store);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Product> findByNameContainingIgnoreCaseAndProductType(String name, String productType, Pageable pageable);

    Optional<Product> findByUrl(String url);
    Page<Product> findAll(Pageable pageable);

    @Query("SELECT p.id FROM products p ORDER BY p.id ASC")
    List<Long> findAllIds();

    @Query(value = """
            SELECT DISTINCT brand FROM products
            WHERE brand IS NOT NULL
              AND brand NOT LIKE '%RSD%'
              AND brand NOT LIKE '%Kategorij%'
              AND brand NOT LIKE '%Dodaj%'
              AND brand NOT LIKE '%stanju%'
              AND brand NOT LIKE '%korpu%'
              AND brand NOT LIKE '%kom.%'
              AND LENGTH(brand) <= 60
            ORDER BY brand ASC
            """, nativeQuery = true)
    List<String> findAllUniqueBrands();

    @Query(value = """
            SELECT DISTINCT brand FROM products
            WHERE brand IS NOT NULL
              AND market = :market
              AND brand NOT LIKE '%RSD%'
              AND brand NOT LIKE '%Kategorij%'
              AND brand NOT LIKE '%Dodaj%'
              AND brand NOT LIKE '%stanju%'
              AND brand NOT LIKE '%korpu%'
              AND brand NOT LIKE '%kom.%'
              AND LENGTH(brand) <= 60
            ORDER BY brand ASC
            """, nativeQuery = true)
    List<String> findAllUniqueBrandsByMarket(@Param("market") String market);

    @Query(value = "SELECT DISTINCT flavour FROM product_flavours WHERE flavour IS NOT NULL ORDER BY flavour ASC", nativeQuery = true)
    List<String> findAllUniqueFlavours();

    // Brand / flavour lists of one product family — the protein filters must not list creatine-only
    // brands or flavours and vice versa.
    @Query(value = """
            SELECT DISTINCT brand FROM products
            WHERE brand IS NOT NULL
              AND market = :market
              AND product_type = :productType
              AND brand NOT LIKE '%RSD%'
              AND brand NOT LIKE '%Kategorij%'
              AND brand NOT LIKE '%Dodaj%'
              AND brand NOT LIKE '%stanju%'
              AND brand NOT LIKE '%korpu%'
              AND brand NOT LIKE '%kom.%'
              AND LENGTH(brand) <= 60
            ORDER BY brand ASC
            """, nativeQuery = true)
    List<String> findAllUniqueBrandsByMarketAndType(@Param("market") String market,
                                                    @Param("productType") String productType);

    @Query(value = """
            SELECT DISTINCT pf.flavour
            FROM product_flavours pf
            JOIN products p ON pf.product_id = p.id
            WHERE pf.flavour IS NOT NULL
              AND p.market = :market
              AND p.product_type = :productType
            ORDER BY pf.flavour ASC
            """, nativeQuery = true)
    List<String> findAllUniqueFlavoursByMarketAndType(@Param("market") String market,
                                                      @Param("productType") String productType);

    // Brands a specific store currently carries — used by the store competitive report to
    // work out which trending-search brands the store is NOT stocking (missed opportunity).
    @Query(value = """
            SELECT DISTINCT p.brand FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE s.name = :storeName AND p.brand IS NOT NULL
            """, nativeQuery = true)
    List<String> findDistinctBrandsByStoreName(@Param("storeName") String storeName);

    @Query(value = """
            SELECT DISTINCT pf.flavour
            FROM product_flavours pf
            JOIN products p ON pf.product_id = p.id
            WHERE pf.flavour IS NOT NULL
              AND p.market = :market
            ORDER BY pf.flavour ASC
            """, nativeQuery = true)
    List<String> findAllUniqueFlavoursByMarket(@Param("market") String market);

    @Query("SELECT p FROM products p WHERE p.proteinPer100g IS NULL")
    List<Product> findByProteinPer100gIsNull();

    // Creatine has no protein content by nature, so a null protein there is not "missing data".
    @Query("SELECT p FROM products p WHERE p.proteinPer100g IS NULL AND p.productType = :productType")
    List<Product> findByProteinPer100gIsNullAndProductType(@Param("productType") String productType);

    @Query("SELECT p.url FROM products p WHERE p.store.name = :storeName")
    List<String> findUrlsByStoreName(@Param("storeName") String storeName);

    // Scoped variant for stores that host more than one product family under the same
    // `stores` row (e.g. GymBeam protein + GymBeam creatine) — stale-URL detection must not
    // treat the other family's products as missing just because this listing never covers them.
    @Query("SELECT p.url FROM products p WHERE p.store.name = :storeName AND p.productType = :productType")
    List<String> findUrlsByStoreNameAndProductType(@Param("storeName") String storeName,
                                                    @Param("productType") String productType);

    // Every stored row of a store, any product type — ScraperService asks each type's profile which
    // of them already have everything a detail-page visit could add.
    @Query("SELECT p FROM products p WHERE p.store.name = :storeName")
    List<Product> findAllByStoreName(@Param("storeName") String storeName);

    @Modifying
    @Transactional
    @Query("DELETE FROM products p WHERE p.url IN :urls")
    void deleteByUrlIn(@Param("urls") Collection<String> urls);

    @Modifying
    @Transactional
    @Query("UPDATE products p SET p.missedScrapes = p.missedScrapes + 1 WHERE p.url IN :urls")
    void incrementMissedScrapes(@Param("urls") Collection<String> urls);

    @Modifying
    @Transactional
    @Query("UPDATE products p SET p.missedScrapes = 0 WHERE p.url IN :urls AND p.missedScrapes <> 0")
    void resetMissedScrapes(@Param("urls") Collection<String> urls);

    @Query("SELECT p.url FROM products p WHERE p.url IN :urls AND p.missedScrapes >= :threshold")
    List<String> findUrlsWithMissedScrapesAtLeast(@Param("urls") Collection<String> urls, @Param("threshold") int threshold);

    @Query("SELECT p FROM products p WHERE LOWER(TRIM(p.name)) = :name " +
           "AND (:brand IS NULL OR LOWER(TRIM(p.brand)) = :brand) " +
           "AND (:market IS NULL OR p.market = :market)")
    List<Product> findSameProductAcrossStores(@Param("name") String name, @Param("brand") String brand, @Param("market") String market);

    @Query("SELECT p FROM products p WHERE p.store.name = :storeName AND LOWER(TRIM(p.name)) = :name")
    Optional<Product> findByStoreNameAndNormalizedName(@Param("storeName") String storeName, @Param("name") String name);

    @Query("SELECT p FROM products p WHERE p.aiDescription IS NULL")
    List<Product> findByAiDescriptionIsNull();

    // The AI description prompt is written for whey protein; creatine rows would get whey-protein copy.
    @Query("SELECT p FROM products p WHERE p.aiDescription IS NULL AND p.productType = :productType")
    List<Product> findByAiDescriptionIsNullAndProductType(@Param("productType") String productType);

    List<Product> findByGroupId(Long groupId);

    // Group-wide canonical id (lowest id across ALL group members, unfiltered by store/price) —
    // must stay the single source of truth for "which member is SEO-canonical" so the product
    // page's rel=canonical and sitemap.ts's dedup can never disagree (they used to compute this
    // independently and could diverge — see ProductGroupService.getStorePrices() cheapest-per-store
    // filtering vs. sitemap's unfiltered group scan).
    @Query("SELECT MIN(p.id) FROM products p WHERE p.groupId = :groupId")
    Long findMinIdByGroupId(@Param("groupId") Long groupId);

    // Scoped to one product type: a 500 g creatine and a 500 g protein of the same store must never be
    // taken for the same row when a URL changes.
    @Query("SELECT p FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) " +
           "AND p.store = :store " +
           "AND p.productType = :productType " +
           "AND p.primaryWeightGrams IS NOT NULL " +
           "AND ABS(p.primaryWeightGrams - :weight) < 10")
    Optional<Product> findByNameAndStoreAndWeight(@Param("name") String name,
                                                  @Param("store") Store store,
                                                  @Param("weight") Double weight,
                                                  @Param("productType") String productType);

    // Broader candidate pool for fuzzy name matching when both URL and exact name changed at once
    // (e.g. a store re-platforms and rewrites its listing copy in the same pass).
    @Query("SELECT p FROM products p WHERE p.store = :store " +
           "AND p.productType = :productType " +
           "AND p.primaryWeightGrams IS NOT NULL " +
           "AND ABS(p.primaryWeightGrams - :weight) < 10")
    List<Product> findByStoreAndWeight(@Param("store") Store store, @Param("weight") Double weight,
                                       @Param("productType") String productType);
}
