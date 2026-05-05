package com.proteinoteka.controller;

import com.proteinoteka.service.AiDescriptionJob;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AiAdminController {

    private final AiDescriptionJob aiDescriptionJob;

    @PostMapping("/enrich-descriptions")
    public ResponseEntity<String> enrichDescriptions() {
        aiDescriptionJob.enrichAllMissingDescriptions();
        return ResponseEntity.accepted().body("AI description enrichment started in background");
    }
}
