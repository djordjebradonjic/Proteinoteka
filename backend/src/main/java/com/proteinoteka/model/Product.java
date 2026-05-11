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

    @Column(name = "ai_description", columnDefinition = "TEXT")
    private String aiDescription;
}
