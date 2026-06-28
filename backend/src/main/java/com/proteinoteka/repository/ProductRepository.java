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

    @Query("SELECT p FROM products p WHERE p.store.name = :storeName " +
           "AND p.proteinPer100g IS NOT NULL AND p.fatPer100g IS NOT NULL")
    List<Product> findNutritionStatusByStoreName(@Param("storeName") String storeName);

    @Modifying
    @Transactional
    @Query("DELETE FROM products p WHERE p.url IN :urls")
    void deleteByUrlIn(@Param("urls") Collection<String> urls);

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
}
