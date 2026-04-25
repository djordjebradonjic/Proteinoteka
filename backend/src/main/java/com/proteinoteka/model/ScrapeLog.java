package com.proteinoteka.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "scrape_log")
@Data
@NoArgsConstructor
public class ScrapeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_name", nullable = false)
    private String storeName;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "products_found")
    private Integer productsFound;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScrapeStatus status;

    @Column(name = "error_message")
    private String errorMessage;

    public ScrapeLog(String storeName) {
        this.storeName = storeName;
        this.startedAt = LocalDateTime.now();
        this.status = ScrapeStatus.RUNNING;
    }
}
