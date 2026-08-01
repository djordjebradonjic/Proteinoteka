package com.proteinoteka.repository;

import com.proteinoteka.model.ScrapeLog;
import com.proteinoteka.model.ScrapeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ScrapeLogRepository extends JpaRepository<ScrapeLog, Long> {

    Optional<ScrapeLog> findFirstByStoreNameOrderByStartedAtDesc(String storeName);

    Optional<ScrapeLog> findFirstByStoreNameAndStatusOrderByStartedAtDesc(String storeName, ScrapeStatus status);

    boolean existsByStoreNameAndStartedAtAfter(String storeName, LocalDateTime after);

    long countByStoreNameAndStartedAtAfter(String storeName, LocalDateTime after);

    @Query("SELECT s FROM ScrapeLog s WHERE s.startedAt = (" +
           "  SELECT MAX(s2.startedAt) FROM ScrapeLog s2 WHERE s2.storeName = s.storeName" +
           ")")
    List<ScrapeLog> findLatestPerStore();
}
