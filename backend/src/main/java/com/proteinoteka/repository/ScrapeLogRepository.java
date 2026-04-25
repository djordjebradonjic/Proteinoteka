package com.proteinoteka.repository;

import com.proteinoteka.model.ScrapeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ScrapeLogRepository extends JpaRepository<ScrapeLog, Long> {

    Optional<ScrapeLog> findFirstByStoreNameOrderByStartedAtDesc(String storeName);

    @Query("SELECT s FROM ScrapeLog s WHERE s.startedAt = (" +
           "  SELECT MAX(s2.startedAt) FROM ScrapeLog s2 WHERE s2.storeName = s.storeName" +
           ")")
    List<ScrapeLog> findLatestPerStore();
}
