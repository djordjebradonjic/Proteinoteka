package com.proteinoteka.controller;

import com.proteinoteka.repository.AlertJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/alerts/track")
@RequiredArgsConstructor
@Slf4j
public class AlertTrackingController {

    // 1×1 transparent GIF — standard email tracking pixel
    private static final byte[] TRANSPARENT_GIF = Base64.getDecoder().decode(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    );

    private final AlertJobRepository alertJobRepo;

    /**
     * Email open tracking pixel.
     * Called automatically when email client loads images.
     * Returns a 1×1 transparent GIF and records the first open time.
     */
    @GetMapping(value = "/open", produces = MediaType.IMAGE_GIF_VALUE)
    @Transactional
    public ResponseEntity<byte[]> trackOpen(@RequestParam Long job) {
        alertJobRepo.findById(job).ifPresent(j -> {
            if (j.getOpenedAt() == null) {
                j.setOpenedAt(LocalDateTime.now());
                alertJobRepo.save(j);
                log.info("[AlertTracking] Email opened: job={}", job);
            }
        });
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(TRANSPARENT_GIF);
    }

    /**
     * Click tracking redirect.
     * All CTA links in alert emails point here first, then redirect to the real URL.
     * Records the first click time, then 302 to the destination.
     */
    @GetMapping("/click")
    @Transactional
    public ResponseEntity<Void> trackClick(
            @RequestParam Long job,
            @RequestParam String redirect
    ) {
        alertJobRepo.findById(job).ifPresent(j -> {
            if (j.getClickedAt() == null) {
                j.setClickedAt(LocalDateTime.now());
                alertJobRepo.save(j);
                log.info("[AlertTracking] Email clicked: job={}", job);
            }
        });
        return ResponseEntity.status(302)
                .location(URI.create(redirect))
                .build();
    }
}
