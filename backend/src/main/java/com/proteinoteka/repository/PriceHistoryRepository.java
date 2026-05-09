package com.proteinoteka.repository;

import com.proteinoteka.model.PriceHistory;
import com.proteinoteka.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    @Query("SELECT DISTINCT h.product FROM PriceHistory h WHERE h.timestamp >= :since")
    List<Product> findProductsWithHistorySince(@Param("since") LocalDateTime since);

    // Products with 2+ price_history entries (price changed at least once),
    // regardless of when — used by the price-drops endpoint.
    @Query("SELECT p FROM products p WHERE SIZE(p.priceHistories) >= 2")
    List<Product> findProductsWithMultiplePriceEntries();
}
