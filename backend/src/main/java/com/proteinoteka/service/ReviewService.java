package com.proteinoteka.service;

import com.proteinoteka.dto.AggregateRatingDTO;
import com.proteinoteka.dto.ReviewDTO;
import com.proteinoteka.dto.ReviewSubmitRequest;
import com.proteinoteka.model.Review;
import com.proteinoteka.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public void submit(Long productId, ReviewSubmitRequest req) {
        if (req.rating() == null || req.rating() < 1 || req.rating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        Review review = new Review();
        review.setProductId(productId);
        review.setRating(req.rating());
        review.setDisplayName(sanitize(req.displayName(), 100));
        review.setEmail(sanitize(req.email(), 255));
        review.setComment(sanitize(req.comment(), 2000));
        review.setStatus("pending");
        reviewRepository.save(review);
    }

    public List<ReviewDTO> getApproved(Long productId) {
        return reviewRepository
                .findByProductIdAndStatusOrderByCreatedAtDesc(productId, "approved")
                .stream()
                .map(r -> new ReviewDTO(r.getId(), r.getDisplayName(), r.getRating(), r.getComment(), r.getCreatedAt()))
                .toList();
    }

    public AggregateRatingDTO getAggregate(Long productId) {
        Double avg = reviewRepository.avgRatingByProductId(productId);
        Long count = reviewRepository.countApprovedByProductId(productId);
        if (avg == null || count == null || count == 0) return new AggregateRatingDTO(0, 0);
        return new AggregateRatingDTO(Math.round(avg * 10.0) / 10.0, count);
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> listPending() {
        return reviewRepository.findByStatusOrderByCreatedAtDesc("pending").stream()
                .map(r -> Map.<String, Object>of(
                        "id", r.getId(),
                        "productId", r.getProductId(),
                        "displayName", r.getDisplayName() != null ? r.getDisplayName() : "",
                        "email", r.getEmail() != null ? r.getEmail() : "",
                        "rating", r.getRating(),
                        "comment", r.getComment() != null ? r.getComment() : "",
                        "createdAt", r.getCreatedAt().toString()
                ))
                .toList();
    }

    public void approve(Long id) {
        reviewRepository.findById(id).ifPresent(r -> {
            r.setStatus("approved");
            reviewRepository.save(r);
        });
    }

    public void delete(Long id) {
        reviewRepository.deleteById(id);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String sanitize(String value, int maxLen) {
        if (value == null) return null;
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed.substring(0, Math.min(trimmed.length(), maxLen));
    }
}
