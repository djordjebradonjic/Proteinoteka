package com.proteinoteka.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    @ManyToOne
    @JoinColumn(name= "store_id")
    private Store store;

    private LocalDateTime last_updated = LocalDateTime.now();
}
