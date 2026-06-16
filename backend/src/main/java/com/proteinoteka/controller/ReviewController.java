package com.proteinoteka.controller;

import com.proteinoteka.dto.AggregateRatingDTO;
import com.proteinoteka.dto.ReviewDTO;
import com.proteinoteka.dto.ReviewSubmitRequest;
import com.proteinoteka.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // ── Public ─────────────────────────────────────────────────────────────────

    @PostMapping("/api/v1/products/{id}/reviews")
    public ResponseEntity<Map<String, String>> submit(
            @PathVariable Long id,
            @RequestBody ReviewSubmitRequest req) {
        try {
            reviewService.submit(id, req);
            return ResponseEntity.ok(Map.of("message", "Recenzija primljena. Biće objavljena nakon pregleda."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/v1/products/{id}/reviews")
    public List<ReviewDTO> getApproved(@PathVariable Long id) {
        return reviewService.getApproved(id);
    }

    @GetMapping("/api/v1/products/{id}/reviews/aggregate")
    public AggregateRatingDTO getAggregate(@PathVariable Long id) {
        return reviewService.getAggregate(id);
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    @GetMapping("/api/admin/reviews")
    public List<Map<String, Object>> listPending(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        validateAdmin(token);
        return reviewService.listPending();
    }

    @PutMapping("/api/admin/reviews/{id}/approve")
    public ResponseEntity<Void> approve(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        validateAdmin(token);
        reviewService.approve(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/api/admin/reviews/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        validateAdmin(token);
        reviewService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private void validateAdmin(String token) {
        String expected = System.getenv("ADMIN_TOKEN");
        if (expected != null && !expected.isBlank() && !expected.equals(token)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }
}
