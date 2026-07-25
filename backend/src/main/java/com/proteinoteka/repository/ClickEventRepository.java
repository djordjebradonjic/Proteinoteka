package com.proteinoteka.repository;

import com.proteinoteka.model.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

    // Raw click rows for a set of products, used by StoreReportService to correlate a
    // competitor's buy-click (by IP + time window) back to an earlier product view.
    @Query(value = """
            SELECT product_id, ip_address, created_at, store_name
            FROM click_events
            WHERE product_id IN (:productIds)
              AND created_at >= :since
            """, nativeQuery = true)
    List<Object[]> clickRowsForProducts(@Param("productIds") Collection<Long> productIds, @Param("since") LocalDateTime since);

    @Query(value = """
            SELECT COUNT(*) FROM click_events
            WHERE store_name = :storeName AND created_at >= :since
            """, nativeQuery = true)
    long countByStoreNameSince(@Param("storeName") String storeName, @Param("since") LocalDateTime since);

    @Query(value = """
            SELECT COUNT(*) FROM click_events
            WHERE product_id = :productId
              AND ip_address = :ipAddress
              AND created_at >= :since
            """, nativeQuery = true)
    long countRecentByProductAndIp(Long productId, String ipAddress, LocalDateTime since);


    @Query(value = """
            SELECT store_name, COUNT(*) AS count
            FROM click_events
            WHERE store_name IS NOT NULL
            GROUP BY store_name
            ORDER BY count DESC
            """, nativeQuery = true)
    List<Object[]> clicksPerStore();

    @Query(value = """
            SELECT ce.product_id, p.name, COUNT(*) AS count
            FROM click_events ce
            JOIN products p ON ce.product_id = p.id
            WHERE ce.product_id IS NOT NULL
            GROUP BY ce.product_id, p.name
            ORDER BY count DESC
            LIMIT 10
            """, nativeQuery = true)
    List<Object[]> topProducts();

    @Query(value = """
            SELECT DATE(created_at) AS day, COUNT(*) AS count
            FROM click_events
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> clicksLast7Days();

    // market-filtered variants (market = null → no filter)
    @Query(value = """
            SELECT ce.store_name, COUNT(*) AS count
            FROM click_events ce
            JOIN products p ON ce.product_id = p.id
            WHERE ce.store_name IS NOT NULL
              AND (:market IS NULL OR p.market = :market)
            GROUP BY ce.store_name
            ORDER BY count DESC
            """, nativeQuery = true)
    List<Object[]> clicksPerStoreByMarket(@Param("market") String market);

    @Query(value = """
            SELECT ce.product_id, p.name, COUNT(*) AS count
            FROM click_events ce
            JOIN products p ON ce.product_id = p.id
            WHERE ce.product_id IS NOT NULL
              AND (:market IS NULL OR p.market = :market)
            GROUP BY ce.product_id, p.name
            ORDER BY count DESC
            LIMIT 10
            """, nativeQuery = true)
    List<Object[]> topProductsByMarket(@Param("market") String market);

    @Query(value = """
            SELECT DATE(ce.created_at) AS day, COUNT(*) AS count
            FROM click_events ce
            JOIN products p ON ce.product_id = p.id
            WHERE ce.created_at >= NOW() - INTERVAL '7 days'
              AND (:market IS NULL OR p.market = :market)
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> clicksLast7DaysByMarket(@Param("market") String market);

    @Query(value = """
            SELECT COUNT(*) FROM click_events ce
            JOIN products p ON ce.product_id = p.id
            WHERE (:market IS NULL OR p.market = :market)
            """, nativeQuery = true)
    long countByMarket(@Param("market") String market);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "DELETE FROM click_events WHERE created_at < :cutoff", nativeQuery = true)
    int deleteByCreatedAtBefore(@Param("cutoff") LocalDateTime cutoff);
}
