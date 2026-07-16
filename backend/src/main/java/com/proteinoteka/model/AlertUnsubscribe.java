package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "alert_unsubscribes")
@Data
@NoArgsConstructor
public class AlertUnsubscribe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String market = "rs";

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
