package com.proteinoteka.controller;

import com.proteinoteka.dto.WishlistSyncRequest;
import com.proteinoteka.model.WishlistItem;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class WishlistController {

    private final WishlistItemRepository repo;

    @GetMapping
    public List<Long> getWishlist(@RequestParam String email) {
        return repo.findByEmail(email.toLowerCase().trim())
                .stream()
                .map(WishlistItem::getProductId)
                .toList();
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<Void> saveWishlist(@RequestBody WishlistSyncRequest req) {
        if (req.email() == null || !req.email().contains("@")) {
            return ResponseEntity.badRequest().build();
        }

        String email = req.email().toLowerCase().trim();
        List<Long> productIds = req.productIds() != null ? req.productIds() : List.of();

        repo.deleteByEmail(email);

        if (!productIds.isEmpty()) {
            List<WishlistItem> items = productIds.stream().map(pid -> {
                WishlistItem item = new WishlistItem();
                item.setEmail(email);
                item.setProductId(pid);
                return item;
            }).toList();
            repo.saveAll(items);
        }

        return ResponseEntity.ok().build();
    }
}
