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

    @Column(name = "products_removed")
    private Integer productsRemoved;

    @Column(name = "error_message")
    private String errorMessage;

    // "protein=86,creatine=14" — products saved per product type in this run.
    @Column(name = "product_type_counts")
    private String productTypeCounts;

    // Estimated IPRoyal traffic (bytes) of this run; null when the store doesn't use the proxy.
    @Column(name = "proxy_bytes")
    private Long proxyBytes;

    public ScrapeLog(String storeName) {
        this.storeName = storeName;
        this.startedAt = LocalDateTime.now();
        this.status = ScrapeStatus.RUNNING;
    }
}
