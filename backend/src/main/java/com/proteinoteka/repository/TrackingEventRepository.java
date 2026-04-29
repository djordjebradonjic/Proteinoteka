package com.proteinoteka.repository;

import com.proteinoteka.model.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {

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
}
