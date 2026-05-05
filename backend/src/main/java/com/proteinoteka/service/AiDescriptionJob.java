package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiDescriptionJob {

    private final ProductRepository productRepository;
    private final AiDescriptionService aiDescriptionService;

    @Async
    public void enrichAllMissingDescriptions() {
        List<Product> products = productRepository.findByAiDescriptionIsNull();
        log.info("AI description job started — {} products to process", products.size());

        int success = 0;
        int failed = 0;

        for (Product product : products) {
            boolean ok = aiDescriptionService.enrichProduct(product);
            if (ok) {
                success++;
            } else {
                failed++;
            }

            try {
                Thread.sleep(300);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("AI description job interrupted");
                break;
            }
        }

        log.info("AI description job done: {} success, {} failed", success, failed);
    }
}
