package com.proteinoteka.repository;

import com.proteinoteka.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataQualityRepository extends JpaRepository<Product, Long> {

    // market = null → both markets combined, "rs"/"hr" → filtered (same (:market IS NULL OR ...)
    // convention as ClickEventRepository/TrackingEventRepository)

    @Query("SELECT COUNT(p) FROM products p WHERE (:market IS NULL OR p.market = :market)")
    int countTotal(@Param("market") String market);

    // Nutrition
    @Query("SELECT COUNT(p) FROM products p WHERE p.proteinPer100g IS NULL AND (:market IS NULL OR p.market = :market)")
    int countWithoutProtein(@Param("market") String market);

    // Value Score
    @Query("SELECT COUNT(p) FROM products p WHERE (p.valueScore IS NULL OR p.valueScore = 0) AND (:market IS NULL OR p.market = :market)")
    int countWithoutValueScore(@Param("market") String market);

    // Images
    @Query("SELECT COUNT(p) FROM products p WHERE p.imageUrl IS NOT NULL AND p.imageUrl != '' AND (:market IS NULL OR p.market = :market)")
    int countWithImage(@Param("market") String market);

    // numericPrice problemi
    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice IS NULL AND (:market IS NULL OR p.market = :market)")
    int countNullNumericPrice(@Param("market") String market);

    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice = 0 AND (:market IS NULL OR p.market = :market)")
    int countZeroNumericPrice(@Param("market") String market);

    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice > 100000 AND (:market IS NULL OR p.market = :market)")
    int countSuspiciouslyHighPrice(@Param("market") String market);

    @Query("SELECT COUNT(p) FROM products p WHERE p.numericPrice > 0 AND p.numericPrice <= 100000 AND (:market IS NULL OR p.market = :market)")
    int countValidNumericPrice(@Param("market") String market);

    // String price null/prazan (originalni scraped string)
    @Query("SELECT COUNT(p) FROM products p WHERE (p.price IS NULL OR p.price = '') AND (:market IS NULL OR p.market = :market)")
    int countEmptyPriceString(@Param("market") String market);

    // Bez prodavnice
    @Query("SELECT COUNT(p) FROM products p WHERE p.store IS NULL AND (:market IS NULL OR p.market = :market)")
    int countWithoutStore(@Param("market") String market);

    @Query("SELECT COUNT(p) FROM products p WHERE p.sugarPer100g IS NULL AND (:market IS NULL OR p.market = :market)")
    int countWithoutSugar(@Param("market") String market);

    // Fat
    @Query("SELECT COUNT(p) FROM products p WHERE p.fatPer100g IS NULL AND (:market IS NULL OR p.market = :market)")
    int countWithoutFat(@Param("market") String market);

    // Calories
    @Query("SELECT COUNT(p) FROM products p WHERE p.caloriePer100g IS NULL AND (:market IS NULL OR p.market = :market)")
    int countWithoutCalories(@Param("market") String market);

    // Protein source
    @Query("SELECT COUNT(p) FROM products p WHERE (p.proteinSource IS NULL OR p.proteinSource = '') AND (:market IS NULL OR p.market = :market)")
    int countWithoutProteinSource(@Param("market") String market);

    // Primary weight grams
    @Query("SELECT COUNT(p) FROM products p WHERE (p.primaryWeightGrams IS NULL OR p.primaryWeightGrams = 0) AND (:market IS NULL OR p.market = :market)")
    int countWithoutPrimaryWeight(@Param("market") String market);

    // Duplikati po imenu
    @Query(value = """
            SELECT COUNT(*) FROM (
            SELECT LOWER(TRIM(name))
            FROM products
            WHERE (:market IS NULL OR market = :market)
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
        ) AS dups
        """, nativeQuery = true)
    int countDuplicateGroups(@Param("market") String market);

    @Query(value = """
    SELECT MIN(name) as name, COUNT(*) as cnt
    FROM products
    WHERE (:market IS NULL OR market = :market)
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 20
    """, nativeQuery = true)
    List<Object[]> findTopDuplicates(@Param("market") String market);

    // ── Outlier detection ────────────────────────────────────────────────────

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.protein_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.protein_per_100g > 95
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.protein_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findHighProteinOutliers(@Param("market") String market);

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.protein_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.protein_per_100g < 20
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.protein_per_100g
        """, nativeQuery = true)
    List<Object[]> findLowProteinOutliers(@Param("market") String market);

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.protein_per_100g, p.calorie_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.calorie_per_100g IS NOT NULL
          AND p.protein_per_100g IS NOT NULL
          AND p.calorie_per_100g < p.protein_per_100g * 4
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.calorie_per_100g
        """, nativeQuery = true)
    List<Object[]> findCalorieTooLowOutliers(@Param("market") String market);

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.calorie_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.calorie_per_100g > 600
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.calorie_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findCalorieTooHighOutliers(@Param("market") String market);

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.fat_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.fat_per_100g > 50
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.fat_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findHighFatOutliers(@Param("market") String market);

    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.sugar_per_100g
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.sugar_per_100g > 30
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.sugar_per_100g DESC
        """, nativeQuery = true)
    List<Object[]> findHighSugarOutliers(@Param("market") String market);

    // Whey/casein/gainer packages don't come in fractional-gram sizes below 150g —
    // a decimal weight this low almost always means a site typo ("2,3g" meant "2,3kg").
    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.primary_weight_grams
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.primary_weight_grams IS NOT NULL AND p.primary_weight_grams < 150
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.primary_weight_grams
        """, nativeQuery = true)
    List<Object[]> findImplausiblyLowWeightOutliers(@Param("market") String market);

    // Products whose scraper hasn't touched them in a while — the scrape may be
    // silently failing for this product/variant while the rest of the store updates fine.
    @Query(value = """
        SELECT p.id, s.name AS store, p.name, p.last_updated
        FROM products p JOIN stores s ON p.store_id = s.id
        WHERE p.last_updated < :cutoff
          AND (:market IS NULL OR p.market = :market)
        ORDER BY p.last_updated
        """, nativeQuery = true)
    List<Object[]> findStaleProducts(@Param("cutoff") java.time.LocalDateTime cutoff, @Param("market") String market);
}
