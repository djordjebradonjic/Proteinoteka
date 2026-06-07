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

    @Query("SELECT COUNT(p) FROM products p WHERE p.sugarPer100g IS NULL")
    int countWithoutSugar();

    // Fat
    @Query("SELECT COUNT(p) FROM products p WHERE p.fatPer100g IS NULL")
    int countWithoutFat();

    // Calories
    @Query("SELECT COUNT(p) FROM products p WHERE p.caloriePer100g IS NULL")
    int countWithoutCalories();

    // Protein source
    @Query("SELECT COUNT(p) FROM products p WHERE p.proteinSource IS NULL OR p.proteinSource = ''")
    int countWithoutProteinSource();

    // Primary weight grams
    @Query("SELECT COUNT(p) FROM products p WHERE p.primaryWeightGrams IS NULL OR p.primaryWeightGrams = 0")
    int countWithoutPrimaryWeight();

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

    // ── Outlier detection ────────────────────────────────────────────────────

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.protein_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.protein_per_100g > 95
        ORDER BY p.protein_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findHighProteinOutliers();

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.protein_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.protein_per_100g < 20
        ORDER BY p.protein_per_100g
        """, nativeQuery = true)
    List<Object[]> findLowProteinOutliers();

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.protein_per_100g, p.calorie_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.calorie_per_100g IS NOT NULL
          AND p.protein_per_100g IS NOT NULL
          AND p.calorie_per_100g < p.protein_per_100g * 4
        ORDER BY p.calorie_per_100g
        """, nativeQuery = true)
    List<Object[]> findCalorieTooLowOutliers();

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.calorie_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.calorie_per_100g > 600
        ORDER BY p.calorie_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findCalorieTooHighOutliers();

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.fat_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.fat_per_100g > 50
        ORDER BY p.fat_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findHighFatOutliers();

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.sugar_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.sugar_per_100g > 30
        ORDER BY p.sugar_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findHighSugarOutliers();
}