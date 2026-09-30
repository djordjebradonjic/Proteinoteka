package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

// See Product.java: Getter/Setter instead of @Data for the same reason (this is the other side of
// the bidirectional Product <-> PriceHistory relation).
@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "product")
@NoArgsConstructor
@AllArgsConstructor
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String price;

    @Column(name = "numeric_price")
    private Double numericPrice;

    private LocalDateTime timestamp= LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name= "product_id")
    private Product product;
}
