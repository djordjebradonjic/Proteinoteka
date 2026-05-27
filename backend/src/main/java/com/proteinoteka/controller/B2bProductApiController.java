package com.proteinoteka.controller;

import com.proteinoteka.dto.B2bProductDTO;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/b2b")
@RequiredArgsConstructor
@Slf4j
public class B2bProductApiController {

    private final ProductRepository productRepository;

    @Value("${b2b.api.keys:}")
    private String rawApiKeys;

    private Set<String> validApiKeys;

    @PostConstruct
    void init() {
        validApiKeys = Arrays.stream(rawApiKeys.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
        log.info("B2B API initialized with {} active key(s)", validApiKeys.size());
    }

    @GetMapping("/products")
    public ResponseEntity<?> getProducts(
            @RequestParam(name = "api_key") String apiKey,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        String keyPreview = apiKey.length() > 8 ? apiKey.substring(0, 8) + "..." : "***";
        if (!validApiKeys.contains(apiKey)) {
            log.warn("B2B API — odbijen pristup, nevalidan ključ: {}", keyPreview);
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "API ključ nije validan. Kontaktirajte nas na kontakt@proteinoteka.rs."
            ));
        }

        int safeSize = Math.min(size, 200);
        log.info("B2B API — uspešan pristup (ključ: {}), page={} size={}", keyPreview, page, safeSize);

        Page<B2bProductDTO> result = productRepository
                .findAll(PageRequest.of(page, safeSize))
                .map(this::toB2bDTO);

        return ResponseEntity.ok(result);
    }

    private B2bProductDTO toB2bDTO(Product p) {
        return new B2bProductDTO(
                p.getId(),
                p.getName(),
                p.getBrand(),
                p.getStore() != null ? p.getStore().getName() : null,
                p.getUrl(),
                p.getImageUrl(),
                p.getNumericPrice(),
                p.getProteinPer100g(),
                p.getFatPer100g(),
                p.getSugarPer100g(),
                p.getCaloriePer100g(),
                p.getProteinSource(),
                p.getPrimaryWeightGrams(),
                p.getValueScore(),
                p.getPercentileRank(),
                p.getFlavours(),
                p.getPackage_weight(),
                p.getCanonicalSlug(),
                p.getLastUpdated()
        );
    }
}
