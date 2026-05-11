package com.proteinoteka.controller;

import com.proteinoteka.model.AlertUnsubscribe;
import com.proteinoteka.repository.AlertUnsubscribeRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@Slf4j
public class UnsubscribeController {

    private final WishlistItemRepository wishlistItemRepo;
    private final AlertUnsubscribeRepository unsubscribeRepo;

    @Value("${app.frontend-url:https://proteinoteka.rs}")
    private String frontendUrl;

    /**
     * One-click unsubscribe from price alerts for a specific product.
     * No login required — the UUID token is secure enough for this purpose.
     * Always redirects (even if token is unknown) to avoid info leakage.
     */
    @GetMapping("/unsubscribe")
    @Transactional
    public ResponseEntity<Void> unsubscribe(@RequestParam UUID token) {
        wishlistItemRepo.findByUnsubscribeToken(token).ifPresentOrElse(
                item -> {
                    // Append to unsubscribe log before deleting the item
                    AlertUnsubscribe record = new AlertUnsubscribe();
                    record.setEmail(item.getEmail());
                    record.setProductId(item.getProductId());
                    unsubscribeRepo.save(record);

                    wishlistItemRepo.delete(item);
                    log.info("[Unsubscribe] Removed wishlist item for {} / product {}",
                            item.getEmail(), item.getProductId());
                },
                () -> log.warn("[Unsubscribe] Unknown token: {}", token)
        );

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl + "/odjava"))
                .build();
    }
}
