package com.proteinoteka.controller;

import com.proteinoteka.dto.DataQualityReport;
import com.proteinoteka.service.DataQualityService;
import com.proteinoteka.service.NutritionEnrichmentJob;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/data-quality")
@RequiredArgsConstructor
public class DataQualityController {

    private final DataQualityService dataQualityService;
    @Autowired
    private NutritionEnrichmentJob enrichmentJob;


    @GetMapping("/report")
    public ResponseEntity<DataQualityReport> getReport(@RequestParam(required = false) String market) {
        final String m = (market != null && !market.isBlank()) ? market : null;
        return ResponseEntity.ok(dataQualityService.generateReport(m));
    }


    @PostMapping("/enrich-nutrition")
    public ResponseEntity<String> enrichNutrition() {
        enrichmentJob.enrichMissingNutrition();
        return ResponseEntity.ok("Enrichment started, check logs");
    }

    @PostMapping("/enrich-all")
    public ResponseEntity<String> enrichAll() {
        enrichmentJob.enrichAllProducts();
        return ResponseEntity.ok("Full enrichment started, check logs");
    }
}