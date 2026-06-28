package com.proteinoteka.repository;

import com.proteinoteka.model.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

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
}
