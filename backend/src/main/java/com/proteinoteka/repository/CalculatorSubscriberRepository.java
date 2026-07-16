package com.proteinoteka.repository;

import com.proteinoteka.model.CalculatorSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalculatorSubscriberRepository extends JpaRepository<CalculatorSubscriber, Long> {

    Optional<CalculatorSubscriber> findByEmail(String email);

    List<CalculatorSubscriber> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT s.goal, COUNT(s) FROM CalculatorSubscriber s WHERE s.goal IS NOT NULL GROUP BY s.goal ORDER BY COUNT(s) DESC")
    List<Object[]> countByGoalGrouped();

    @Query("SELECT s.market, COUNT(s) FROM CalculatorSubscriber s GROUP BY s.market ORDER BY COUNT(s) DESC")
    List<Object[]> countByMarketGrouped();
}
