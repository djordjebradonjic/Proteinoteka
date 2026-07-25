package com.proteinoteka.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String brand;
    private String price;
    private String imageUrl;

    @Column(unique = true)
    private String url;



    private Double valueScore;


    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "protein_per_100g")
    private Double proteinPer100g;

    @Column(name = "sugar_per_100g")
    private Double sugarPer100g;

    @Column(name = "fat_per_100g")
    private Double fatPer100g;

    @Column(name = "calorie_per_100g")
    private Double caloriePer100g;

    // Protein type
    @Column(name = "protein_source")
    private String proteinSource; // "whey_concentrate", "whey_isolate", "hydrolysate", "vegan", "casein"


    @ElementCollection
    @CollectionTable(name = "product_package_weights", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "package_weight")
    @BatchSize(size = 50)
    private List<String> package_weight = new ArrayList<>();

    @Column(name = "primary_weight_grams")
    private Double primaryWeightGrams;

    @ElementCollection
    @CollectionTable(name = "product_flavours", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "flavour")
    @BatchSize(size = 50)
    private List<String> flavours = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name= "store_id")
    private Store store;

    private LocalDateTime lastUpdated = LocalDateTime.now();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<PriceHistory> priceHistories = new ArrayList<>();

    private Double numericPrice= 0.0;

    @Column(name = "protein_per_rsd")
    private Double proteinPerRsd;

    @Column(name = "percentile_rank")
    private Integer percentileRank;

    @Column(name = "ai_description", columnDefinition = "TEXT")
    private String aiDescription;

    // Frozen at creation, never updated afterward — enforced by the trg_protect_canonical_slug
    // DB trigger (V56). Changing an already-indexed product's canonical_slug regenerates a
    // fresh 301-redirect wave in Google Search Console.
    @Column(name = "canonical_slug")
    private String canonicalSlug;

    // Consecutive scrapes in which this product's URL was expected but not found.
    // Reset to 0 whenever the URL is seen again; the product is only deleted once this
    // crosses ScraperService.STALE_MISS_THRESHOLD (see removeStaleProducts).
    @Column(name = "missed_scrapes", nullable = false)
    private Integer missedScrapes = 0;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "market", nullable = false)
    private String market = "rs";

    @Column(name = "currency", nullable = false)
    private String currency = "RSD";

    @Column(name = "protein_per_currency")
    private Double proteinPerCurrency;

    @Column(name = "last_price_change_at")
    private LocalDateTime lastPriceChangeAt;

    @Column(name = "last_price_drop_pct")
    private Double lastPriceDropPct;

    @Column(name = "last_price_increase_pct")
    private Double lastPriceIncreasePct;
}
