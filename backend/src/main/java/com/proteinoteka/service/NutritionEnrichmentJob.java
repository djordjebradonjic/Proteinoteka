package com.proteinoteka.service;


import com.proteinoteka.dto.NutritionDataDTO;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NutritionEnrichmentJob {

    private final ProductRepository productRepository;
    private final AiNutritionService aiNutritionService;

    public void enrichMissingNutrition() {
        List<Product> products = productRepository.findByProteinPer100gIsNull();

        log.info("Found {} products with missing nutrition data", products.size());

        int success = 0;
        int failed = 0;

        for (Product product : products) {
            try {
                NutritionDataDTO data = aiNutritionService.extractNutritionData(
                        product.getName(),
                        product.getDescription(),
                        product.getPackage_weight()
                );

                if (data != null) {
                    if (data.getProteinPer100g() != null)   product.setProteinPer100g(data.getProteinPer100g());
                    if (data.getSugarPer100g() != null)     product.setSugarPer100g(data.getSugarPer100g());
                    if (data.getFatPer100g() != null)       product.setFatPer100g(data.getFatPer100g());
                    if (data.getCaloriePer100g() != null)   product.setCaloriePer100g(data.getCaloriePer100g());
                    if (data.getProteinSource() != null)    product.setProteinSource(data.getProteinSource());
                    if (data.getPrimaryWeightGrams() != null) product.setPrimaryWeightGrams(data.getPrimaryWeightGrams());

                    productRepository.save(product);

                    log.info("✅ {} → protein: {}g, sugar: {}g, fat: {}g, cal: {}, source: {}, weight: {}g",
                            product.getName(),
                            data.getProteinPer100g(),
                            data.getSugarPer100g(),
                            data.getFatPer100g(),
                            data.getCaloriePer100g(),
                            data.getProteinSource(),
                            data.getPrimaryWeightGrams()
                    );
                    success++;
                } else {
                    log.warn("❌ Could not extract nutrition for: {}", product.getName());
                    failed++;
                }

                // Delay to avoid rate limiting
                Thread.sleep(200);

            } catch (Exception e) {
                log.error("Error processing product {}: {}", product.getId(), e.getMessage());
                failed++;
            }
        }

        log.info("Enrichment complete: {} success, {} failed", success, failed);
    }

    public void enrichAllProducts() {
        List<Product> products = productRepository.findAll();

        log.info("Enriching all {} products with full nutrition data", products.size());

        int success = 0;
        int failed = 0;

        for (Product product : products) {
            try {
                NutritionDataDTO data = aiNutritionService.extractNutritionData(
                        product.getName(),
                        product.getDescription(),
                        product.getPackage_weight()
                );

                if (data != null) {
                    // Only update null fields — don't overwrite existing good data
                    if (data.getProteinPer100g() != null && product.getProteinPer100g() == null)
                        product.setProteinPer100g(data.getProteinPer100g());
                    if (data.getSugarPer100g() != null)
                        product.setSugarPer100g(data.getSugarPer100g());
                    if (data.getFatPer100g() != null)
                        product.setFatPer100g(data.getFatPer100g());
                    if (data.getCaloriePer100g() != null)
                        product.setCaloriePer100g(data.getCaloriePer100g());
                    if (data.getProteinSource() != null)
                        product.setProteinSource(data.getProteinSource());
                    if (data.getPrimaryWeightGrams() != null)
                        product.setPrimaryWeightGrams(data.getPrimaryWeightGrams());

                    productRepository.save(product);

                    log.info("✅ {} → sugar: {}g, fat: {}g, cal: {}, source: {}, weight: {}g",
                            product.getName(),
                            data.getSugarPer100g(),
                            data.getFatPer100g(),
                            data.getCaloriePer100g(),
                            data.getProteinSource(),
                            data.getPrimaryWeightGrams()
                    );
                    success++;
                } else {
                    log.warn("❌ No data for: {}", product.getName());
                    failed++;
                }

                Thread.sleep(200);

            } catch (Exception e) {
                log.error("Error processing {}: {}", product.getId(), e.getMessage());
                failed++;
            }
        }

        log.info("Full enrichment complete: {} success, {} failed", success, failed);
    }
}