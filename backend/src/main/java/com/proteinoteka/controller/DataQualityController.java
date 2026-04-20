package com.proteinoteka.controller;

import com.proteinoteka.dto.DataQualityReport;
import com.proteinoteka.service.DataQualityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/data-quality")
@RequiredArgsConstructor
public class DataQualityController {

    private final DataQualityService dataQualityService;

    @GetMapping("/report")
    public ResponseEntity<DataQualityReport> getReport() {
        return ResponseEntity.ok(dataQualityService.generateReport());
    }
}
