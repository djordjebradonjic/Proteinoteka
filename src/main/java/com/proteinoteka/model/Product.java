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
    private String description;
    private List<String> package_weight = new ArrayList<>();
    private List<String> flavours = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name= "store_id")
    private Store store;

    private LocalDateTime lastUpdated = LocalDateTime.now();
}
