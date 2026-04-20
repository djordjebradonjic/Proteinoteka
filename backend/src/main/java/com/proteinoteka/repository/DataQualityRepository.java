package com.proteinoteka.repository;

import com.proteinoteka.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataQualityRepository extends JpaRepository<Product, Long> {

    // Nutrition
    @Query("SELECT COUNT(p) FROM products p WHERE p.proteinPer100g IS NULL")
    int countWithoutProtein();

    // Value Score
    @Query("SELECT COUNT(p) FROM products p WHERE p.valueScore IS NULL OR p.valueScore = 0")
    int countWithoutValueScore();

    // Images
    @Query("SELECT COUNT(p) FROM products p WHERE p.imageUrl IS NOT NULL AND p.imageUrl != ''")
    int countWithImage();

    // numericPrice problemi
    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice IS NULL")
    int countNullNumericPrice();

    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice = 0")
    int countZeroNumericPrice();

    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice > 100000")
    int countSuspiciouslyHighPrice();

    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice > 0 AND p.numericPrice <= 100000")
    int countValidNumericPrice();

    // String price null/prazan (originalni scraped string)
    @Query("SELECT COUNT(p) FROM products p WHERE p.price IS NULL OR p.price = ''")
    int countEmptyPriceString();

    // Bez prodavnice
    @Query("SELECT COUNT(p) FROM products p WHERE p.store IS NULL")
    int countWithoutStore();

    // Duplikati po imenu
    @Query(value = """

            SELECT COUNT(*) FROM (
            SELECT LOWER(TRIM(name))
            FROM products
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
        ) AS dups
        """, nativeQuery = true)
    int countDuplicateGroups();

    @Query(value = """
    SELECT MIN(name) as name, COUNT(*) as cnt
    FROM products
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 20
    """, nativeQuery = true)
    List<Object[]> findTopDuplicates();
    }