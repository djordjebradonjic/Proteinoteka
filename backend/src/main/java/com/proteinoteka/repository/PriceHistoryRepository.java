package com.proteinoteka.repository;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    @Query("SELECT DISTINCT h.product FROM PriceHistory h WHERE h.timestamp >= :since")
    List<Product> findProductsWithHistorySince(@Param("since") LocalDateTime since);

    @Query("SELECT p FROM products p WHERE SIZE(p.priceHistories) >= 1")
    List<Product> findProductsWithMultiplePriceEntries();

    // Returns the lowest recorded price in the last 30 days for a given product.
    // Used to show the "lowest price in 30 days" badge in alert emails.
    @Query("""
            SELECT MIN(h.numericPrice) FROM PriceHistory h
            WHERE h.product.id = :productId
              AND h.timestamp >= :since
              AND h.numericPrice IS NOT NULL
            """)
    Optional<Double> findMinPriceInLast30Days(
            @Param("productId") Long productId,
            @Param("since") LocalDateTime since
    );

    // Price-change frequency per product for a store, used by the store competitive report
    // ("how often do you reprice vs. the market"). Each PriceHistory row already represents
    // an actual price change, not a scrape snapshot (see ScraperService — a row is only
    // written when the numeric price differs from the last recorded one), so a plain count
    // per product is exactly the number of repricing events in the period.
    @Query(value = """
            SELECT ph.product_id, p.name, COUNT(*) AS changes
            FROM price_history ph
            JOIN products p ON ph.product_id = p.id
            JOIN stores s ON p.store_id = s.id
            WHERE s.name = :storeName
              AND ph.timestamp >= :since
            GROUP BY ph.product_id, p.name
            ORDER BY changes DESC
            """, nativeQuery = true)
    List<Object[]> priceChangeCountsByStoreName(@Param("storeName") String storeName, @Param("since") LocalDateTime since);
}
