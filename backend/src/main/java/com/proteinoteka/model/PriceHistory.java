package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String price;

    @Column(name = "numeric_price")
    private Double numericPrice;

    private LocalDateTime timestamp= LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name= "product_id")
    private Product product;
}
