package com.proteinoteka.repository;

import com.proteinoteka.model.AlertJob;
import com.proteinoteka.model.AlertStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertJobRepository extends JpaRepository<AlertJob, Long> {

    // Fetches PENDING jobs and FAILED jobs that still have retries left.
    // Pageable is used to cap the batch size (safety limit).
    @Query("""
            SELECT j FROM AlertJob j
            WHERE (j.status = :pending)
               OR (j.status = :failed AND j.retryCount < 3)
            ORDER BY j.createdAt ASC
            """)
    List<AlertJob> findJobsDueForProcessing(
            @Param("pending") AlertStatus pending,
            @Param("failed") AlertStatus failed,
            Pageable pageable
    );

    long countByStatus(AlertStatus status);

    @Query(value = "SELECT COUNT(*) FROM alert_jobs WHERE status = 'SENT' AND opened_at IS NOT NULL", nativeQuery = true)
    long countOpened();

    @Query(value = "SELECT COUNT(*) FROM alert_jobs WHERE status = 'SENT' AND clicked_at IS NOT NULL", nativeQuery = true)
    long countClicked();

    // Segment CTR: clicks / sent, filtered by whether the subscriber had a target_price
    @Query(value = """
            SELECT COALESCE(
                COUNT(CASE WHEN aj.clicked_at IS NOT NULL THEN 1 END)::float
                / NULLIF(COUNT(CASE WHEN aj.status = 'SENT' THEN 1 END), 0),
                0)
            FROM alert_jobs aj
            JOIN wishlist_items wi ON aj.wishlist_item_id = wi.id
            WHERE wi.target_price IS NOT NULL
            """, nativeQuery = true)
    double ctrBargainHunters();

    @Query(value = """
            SELECT COALESCE(
                COUNT(CASE WHEN aj.clicked_at IS NOT NULL THEN 1 END)::float
                / NULLIF(COUNT(CASE WHEN aj.status = 'SENT' THEN 1 END), 0),
                0)
            FROM alert_jobs aj
            JOIN wishlist_items wi ON aj.wishlist_item_id = wi.id
            WHERE wi.target_price IS NULL
            """, nativeQuery = true)
    double ctrImpulseUsers();

    @Query(value = """
            SELECT COALESCE(
                COUNT(CASE WHEN aj.clicked_at IS NOT NULL THEN 1 END)::float
                / NULLIF(COUNT(CASE WHEN aj.status = 'SENT' THEN 1 END), 0),
                0)
            FROM alert_jobs aj
            JOIN wishlist_items wi ON aj.wishlist_item_id = wi.id
              JOIN (SELECT email FROM wishlist_items GROUP BY email HAVING COUNT(*) >= 2) pu
              ON wi.email = pu.email
            """, nativeQuery = true)
    double ctrPowerUsers();

    @Query(value = """
            SELECT COUNT(*) FROM (
                SELECT email FROM alert_jobs
                WHERE clicked_at IS NOT NULL
                GROUP BY email HAVING COUNT(*) >= 2
            ) t
            """, nativeQuery = true)
    long countHighIntentUsers();
}
