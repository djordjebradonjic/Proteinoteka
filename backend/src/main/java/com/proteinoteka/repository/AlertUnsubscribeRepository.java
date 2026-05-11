package com.proteinoteka.repository;

import com.proteinoteka.model.AlertUnsubscribe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertUnsubscribeRepository extends JpaRepository<AlertUnsubscribe, Long> {

    @Query(value = "SELECT COUNT(*) FROM alert_unsubscribes WHERE created_at >= NOW() - INTERVAL '30 days'", nativeQuery = true)
    long countLast30Days();
}
