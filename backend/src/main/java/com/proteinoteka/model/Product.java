package com.proteinoteka.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String url;

    @Column(name = "protein_per_100g")
    private Double proteinPer100g;

    private Double valueScore;


    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(name = "product_package_weights", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "package_weight")
    private List<String> package_weight = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "product_flavours", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "flavour")
    private List<String> flavours = new ArrayList<>();
    @ManyToOne
    @JoinColumn(name= "store_id")
    private Store store;

    private LocalDateTime lastUpdated = LocalDateTime.now();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PriceHistory> priceHistories = new ArrayList<>();

    private Double numericPrice= 0.0;
}
