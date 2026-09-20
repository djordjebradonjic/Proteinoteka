package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_groups")
@Data
@NoArgsConstructor
public class ProductGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "canonical_name", nullable = false)
    private String canonicalName;

    private String brand;

    // Pack size of the members: grams, or pieces for a capsule/tablet/gummy group (see ProductGroupService.sizeOf).
    @Column(name = "weight_grams")
    private Double weightGrams;

    @Column(name = "market", nullable = false)
    private String market = "rs";
}
