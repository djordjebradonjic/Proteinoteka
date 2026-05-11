package com.proteinoteka.repository;

import com.proteinoteka.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByEmail(String email);

    Optional<WishlistItem> findByEmailAndProductId(String email, Long productId);

    Optional<WishlistItem> findByUnsubscribeToken(UUID token);

    // Subscribers eligible for an alert: correct product, outside the cooldown window
    @Query("""
            SELECT w FROM WishlistItem w
            WHERE w.productId = :productId
              AND (w.lastNotifiedAt IS NULL OR w.lastNotifiedAt < :cooldownThreshold)
            """)
    List<WishlistItem> findEligibleForAlert(
            @Param("productId") Long productId,
            @Param("cooldownThreshold") LocalDateTime cooldownThreshold
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM WishlistItem w WHERE w.email = :email AND w.productId IN :productIds")
    void deleteByEmailAndProductIdIn(
            @Param("email") String email,
            @Param("productIds") List<Long> productIds
    );

    @Query("SELECT COUNT(w) FROM WishlistItem w")
    long countTotal();

    @Query("SELECT COUNT(DISTINCT w.email) FROM WishlistItem w")
    long countUniqueEmails();

    @Query("SELECT COUNT(w) FROM WishlistItem w WHERE w.targetPrice IS NOT NULL")
    long countWithTargetPrice();

    // Segmentation queries
    @Query(value = "SELECT COUNT(DISTINCT email) FROM wishlist_items WHERE target_price IS NOT NULL", nativeQuery = true)
    long countBargainHunters();

    @Query(value = "SELECT COUNT(DISTINCT email) FROM wishlist_items WHERE target_price IS NULL", nativeQuery = true)
    long countImpulseUsers();

    @Query(value = "SELECT COALESCE(AVG(cnt), 0) FROM (SELECT COUNT(*) AS cnt FROM wishlist_items GROUP BY email) t", nativeQuery = true)
    double avgAlertsPerUser();

    @Query(value = "SELECT COUNT(*) FROM (SELECT email FROM wishlist_items GROUP BY email HAVING COUNT(*) >= 2) t", nativeQuery = true)
    long countRepeatUsers();
}
