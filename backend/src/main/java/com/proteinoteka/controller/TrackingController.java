package com.proteinoteka.controller;

import com.proteinoteka.service.TrackingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/track")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class TrackingController {

    private final TrackingService trackingService;

    record TrackRequest(String eventType, Long productId, String store, String query) {}

    @PostMapping
    public ResponseEntity<Void> track(@RequestBody TrackRequest body, HttpServletRequest request) {
        trackingService.track(
                body.eventType(),
                body.productId(),
                body.store(),
                body.query(),
                getClientIp(request),
                request.getHeader("User-Agent")
        );
        return ResponseEntity.accepted().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
