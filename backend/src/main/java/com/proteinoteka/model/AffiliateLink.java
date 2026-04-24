package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "affiliate_links")
@Data
@NoArgsConstructor
public class AffiliateLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String storeName;

    private String affiliateUrlPattern;
    private Boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();
}
