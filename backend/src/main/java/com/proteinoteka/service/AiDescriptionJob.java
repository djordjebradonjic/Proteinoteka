package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiDescriptionJob {

    private final ProductRepository productRepository;
    private final AiDescriptionService aiDescriptionService;

    // executeWithLogging() in ScrapingSchedulerService fires this after every store scrape;
    // without a guard, two scrapes finishing close together (e.g. a paired scrape window)
    // start overlapping runs against the same missing-description backlog, wasting AI calls
    // with no extra throughput.
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Async
    public void enrichAllMissingDescriptions() {
        if (!running.compareAndSet(false, true)) {
            log.info("AI description job already running — skipping this trigger");
            return;
        }

        try {
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
        } finally {
            running.set(false);
        }
    }
}
