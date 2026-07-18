package com.proteinoteka.repository;

import com.proteinoteka.model.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {

    Optional<NewsletterSubscriber> findByEmail(String email);

    Optional<NewsletterSubscriber> findByUnsubscribeToken(UUID unsubscribeToken);

    List<NewsletterSubscriber> findTop10ByOrderByCreatedAtDesc();

    List<NewsletterSubscriber> findByMarketAndActiveTrue(String market);

    @Query("SELECT s.source, COUNT(s) FROM NewsletterSubscriber s WHERE s.source IS NOT NULL GROUP BY s.source ORDER BY COUNT(s) DESC")
    List<Object[]> countBySourceGrouped();

    @Query("SELECT s.market, COUNT(s) FROM NewsletterSubscriber s GROUP BY s.market ORDER BY COUNT(s) DESC")
    List<Object[]> countByMarketGrouped();
}
