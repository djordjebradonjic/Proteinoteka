package com.proteinoteka.repository;

import com.proteinoteka.model.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

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
}
