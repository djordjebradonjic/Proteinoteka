package com.proteinoteka.controller;

import com.proteinoteka.dto.TargetPriceRequest;
import com.proteinoteka.dto.WishlistSyncRequest;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.WishlistItem;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class WishlistController {

    private final WishlistItemRepository wishlistRepo;
    private final ProductRepository productRepo;

    @GetMapping
    public List<Long> getWishlist(@RequestParam String email) {
        return wishlistRepo.findByEmail(email.toLowerCase().trim())
                .stream()
                .map(WishlistItem::getProductId)
                .toList();
    }

    /**
     * Syncs the client-side wishlist to the DB.
     *
     * Uses UPSERT semantics instead of DELETE + INSERT so that
     * price_at_subscription, last_notified_at, and unsubscribe_token
     * are preserved for existing items across browser sessions.
     */
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<Void> saveWishlist(@RequestBody WishlistSyncRequest req) {
        if (req.email() == null || !req.email().contains("@")) {
            return ResponseEntity.badRequest().build();
        }

        String email = req.email().toLowerCase().trim();
        List<Long> incoming = req.productIds() != null ? req.productIds() : List.of();
        Set<Long> incomingSet = Set.copyOf(incoming);

        List<WishlistItem> existing = wishlistRepo.findByEmail(email);
        Set<Long> existingIds = existing.stream()
                .map(WishlistItem::getProductId)
                .collect(Collectors.toSet());

        // Delete items that were removed from the wishlist
        List<Long> toDelete = existing.stream()
                .map(WishlistItem::getProductId)
                .filter(id -> !incomingSet.contains(id))
                .toList();
        if (!toDelete.isEmpty()) {
            wishlistRepo.deleteByEmailAndProductIdIn(email, toDelete);
        }

        // Add only genuinely new items — never overwrite existing ones
        List<Long> toAdd = incoming.stream()
                .filter(id -> !existingIds.contains(id))
                .toList();
        if (!toAdd.isEmpty()) {
            Map<Long, Double> priceByProductId = productRepo.findAllById(toAdd).stream()
                    .filter(p -> p.getNumericPrice() != null && p.getNumericPrice() > 0)
                    .collect(Collectors.toMap(Product::getId, Product::getNumericPrice));

            List<WishlistItem> newItems = toAdd.stream().map(pid -> {
                WishlistItem item = new WishlistItem();
                item.setEmail(email);
                item.setProductId(pid);
                Double price = priceByProductId.get(pid);
                if (price != null) {
                    item.setPriceAtSubscription(BigDecimal.valueOf(price));
                }
                return item;
            }).toList();

            wishlistRepo.saveAll(newItems);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Creates or updates a price alert for a specific product.
     * This is the primary entry point for the frontend Price Alert modal.
     * Creates the wishlist_item if it doesn't exist yet (including price_at_subscription).
     */
    @PostMapping("/alert")
    @Transactional
    public ResponseEntity<Void> createOrUpdateAlert(@RequestBody TargetPriceRequest req) {
        if (req.email() == null || !req.email().contains("@") || req.productId() == null) {
            return ResponseEntity.badRequest().build();
        }

        String email = req.email().toLowerCase().trim();
        BigDecimal targetPrice = req.targetPrice() != null ? BigDecimal.valueOf(req.targetPrice()) : null;

        wishlistRepo.findByEmailAndProductId(email, req.productId()).ifPresentOrElse(
                existing -> {
                    existing.setTargetPrice(targetPrice);
                    wishlistRepo.save(existing);
                },
                () -> {
                    WishlistItem item = new WishlistItem();
                    item.setEmail(email);
                    item.setProductId(req.productId());
                    item.setTargetPrice(targetPrice);
                    productRepo.findById(req.productId()).ifPresent(p -> {
                        if (p.getNumericPrice() != null && p.getNumericPrice() > 0) {
                            item.setPriceAtSubscription(BigDecimal.valueOf(p.getNumericPrice()));
                        }
                    });
                    wishlistRepo.save(item);
                }
        );

        return ResponseEntity.ok().build();
    }

    /**
     * Removes a price alert (and the wishlist item) for a specific product.
     * Idempotent — safe to call even if the item doesn't exist.
     */
    @DeleteMapping("/alert")
    @Transactional
    public ResponseEntity<Void> removeAlert(
            @RequestParam String email,
            @RequestParam Long productId
    ) {
        wishlistRepo.findByEmailAndProductId(email.toLowerCase().trim(), productId)
                .ifPresent(wishlistRepo::delete);
        return ResponseEntity.ok().build();
    }
}
