package com.proteinoteka.repository;

import com.proteinoteka.model.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {

    @Query(value = """
            SELECT COUNT(*) FROM tracking_events
            WHERE event_type = :eventType
              AND ip_address = :ip
              AND COALESCE(product_id, -1) = COALESCE(:productId, -1)
              AND COALESCE(query, '') = COALESCE(:query, '')
              AND created_at >= :since
            """, nativeQuery = true)
    long countRecentByTypeIpAndTarget(@Param("eventType") String eventType,
                                       @Param("ip") String ip,
                                       @Param("productId") Long productId,
                                       @Param("query") String query,
                                       @Param("since") LocalDateTime since);

    @Query(value = """
            SELECT DATE(created_at) AS day, COUNT(*) AS count
            FROM tracking_events
            WHERE event_type = :eventType
              AND created_at >= NOW() - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> dailyCountsLast7Days(@Param("eventType") String eventType);

    @Query(value = """
            SELECT te.product_id, p.name, COUNT(*) AS count
            FROM tracking_events te
            JOIN products p ON te.product_id = p.id
            WHERE te.event_type = :eventType
              AND te.product_id IS NOT NULL
            GROUP BY te.product_id, p.name
            ORDER BY count DESC
            LIMIT 10
            """, nativeQuery = true)
    List<Object[]> topProductsByEventType(@Param("eventType") String eventType);

    @Query(value = "SELECT COUNT(*) FROM tracking_events WHERE event_type = :eventType",
           nativeQuery = true)
    long countByEventType(@Param("eventType") String eventType);

    // market-filtered variants (market = null → no filter)
    @Query(value = """
            SELECT DATE(te.created_at) AS day, COUNT(*) AS count
            FROM tracking_events te
            LEFT JOIN products p ON te.product_id = p.id
            WHERE te.event_type = :eventType
              AND te.created_at >= NOW() - INTERVAL '7 days'
              AND (:market IS NULL OR p.market = :market)
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> dailyCountsLast7DaysByMarket(@Param("eventType") String eventType, @Param("market") String market);

    @Query(value = """
            SELECT te.product_id, p.name, COUNT(*) AS count
            FROM tracking_events te
            JOIN products p ON te.product_id = p.id
            WHERE te.event_type = :eventType
              AND te.product_id IS NOT NULL
              AND (:market IS NULL OR p.market = :market)
            GROUP BY te.product_id, p.name
            ORDER BY count DESC
            LIMIT 10
            """, nativeQuery = true)
    List<Object[]> topProductsByEventTypeAndMarket(@Param("eventType") String eventType, @Param("market") String market);

    @Query(value = """
            SELECT COUNT(*) FROM tracking_events te
            LEFT JOIN products p ON te.product_id = p.id
            WHERE te.event_type = :eventType
              AND (:market IS NULL OR p.market = :market)
            """, nativeQuery = true)
    long countByEventTypeAndMarket(@Param("eventType") String eventType, @Param("market") String market);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "DELETE FROM tracking_events", nativeQuery = true)
    void deleteAll();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "DELETE FROM tracking_events WHERE event_type != 'CLICK_OUT'", nativeQuery = true)
    void deleteAllExceptClickOut();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "DELETE FROM tracking_events WHERE created_at < :cutoff", nativeQuery = true)
    int deleteByCreatedAtBefore(@Param("cutoff") LocalDateTime cutoff);
}
