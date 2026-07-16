package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wishlist_items")
@Data
@NoArgsConstructor
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String market = "rs";

    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt = LocalDateTime.now();

    // Price when the user first saved this product — used as the drop baseline
    @Column(name = "price_at_subscription", precision = 10, scale = 2)
    private BigDecimal priceAtSubscription;

    // Cooldown: set to now() after each alert sent, blocks further alerts for 7 days
    @Column(name = "last_notified_at")
    private LocalDateTime lastNotifiedAt;

    // Secure token for one-click unsubscribe links in emails
    @Column(name = "unsubscribe_token", nullable = false, unique = true)
    private UUID unsubscribeToken = UUID.randomUUID();

    // Optional: only alert when price drops below this threshold
    @Column(name = "target_price", precision = 10, scale = 2)
    private BigDecimal targetPrice;
}
