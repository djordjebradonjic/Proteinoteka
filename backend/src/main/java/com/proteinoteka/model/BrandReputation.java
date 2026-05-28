package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "brand_reputation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandReputation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "brand_name", nullable = false, unique = true)
    private String brandName;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false)
    private String tier;

    private String notes;

    @Column(name = "canonical_name")
    private String canonicalName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}