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

    @Query("SELECT p.url FROM products p WHERE p.store.name = :storeName")
    List<String> findUrlsByStoreName(@Param("storeName") String storeName);

    // Scoped variant for stores that host more than one product family under the same
    // `stores` row (e.g. GymBeam protein + GymBeam Kreatin) — stale-URL detection must not
    // treat the other family's products as missing just because this scraper's listing never
    // covers them.
    @Query("SELECT p.url FROM products p WHERE p.store.name = :storeName AND p.productType = :productType")
    List<String> findUrlsByStoreNameAndProductType(@Param("storeName") String storeName,
                                                    @Param("productType") String productType);

    @Query("SELECT p FROM products p WHERE p.store.name = :storeName AND " +
           "((p.productType = 'protein' AND p.proteinPer100g IS NOT NULL AND p.fatPer100g IS NOT NULL) " +
           " OR p.productType = 'creatine')")
    List<Product> findNutritionStatusByStoreName(@Param("storeName") String storeName);

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

    List<Product> findByGroupId(Long groupId);

    @Query("SELECT p FROM products p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) " +
           "AND p.store = :store " +
           "AND p.primaryWeightGrams IS NOT NULL " +
           "AND ABS(p.primaryWeightGrams - :weight) < 10")
    Optional<Product> findByNameAndStoreAndWeight(@Param("name") String name,
                                                  @Param("store") Store store,
                                                  @Param("weight") Double weight);

    // Broader candidate pool for fuzzy name matching when both URL and exact name changed at once
    // (e.g. a store re-platforms and rewrites its listing copy in the same pass).
    @Query("SELECT p FROM products p WHERE p.store = :store " +
           "AND p.primaryWeightGrams IS NOT NULL " +
           "AND ABS(p.primaryWeightGrams - :weight) < 10")
    List<Product> findByStoreAndWeight(@Param("store") Store store, @Param("weight") Double weight);
}
