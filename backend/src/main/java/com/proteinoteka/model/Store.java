package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "stores")
@Data
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String baseUrl;

    @Column(name = "market", nullable = false)
    private String market = "rs";

    @Column(name = "currency", nullable = false)
    private String currency = "RSD";
}
