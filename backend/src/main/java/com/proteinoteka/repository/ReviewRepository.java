package com.proteinoteka.repository;

import com.proteinoteka.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, String status);

    List<Review> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId AND r.status = 'approved'")
    Double avgRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId AND r.status = 'approved'")
    Long countApprovedByProductId(@Param("productId") Long productId);

    // Aggregate rating across every product a store carries — used by the store
    // competitive report. Single-row result: [avgRating (Double, null if no reviews), count (Long)].
    @Query(value = """
            SELECT AVG(r.rating), COUNT(r.id)
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            JOIN stores s ON p.store_id = s.id
            WHERE s.name = :storeName AND r.status = 'approved'
            """, nativeQuery = true)
    List<Object[]> ratingSummaryByStoreName(@Param("storeName") String storeName);
}
