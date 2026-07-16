package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Periodically verifies that every stored product URL still resolves on the store's site.
 * A product can go 404 without ever being caught by ScraperService's stale-removal pass —
 * that pass only flags URLs missing from the current *listing* scrape, but a product that
 * stays listed on a category page while its own detail page 404s (broken link on the
 * store's own site) slips through untouched.
 *
 * Only 404/410 are treated as "dead" — other non-200 codes (403, 5xx, timeouts) usually mean
 * bot-blocking or a transient outage, not a removed product, so those are left alone.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeadLinkCheckService {

    private static final Set<Integer> DEAD_STATUS_CODES = Set.of(404, 410);

    private final ProductRepository productRepository;
    private final ProxyAwareHttpClient httpClient;

    @Transactional
    public List<String> removeDeadLinks() {
        List<Product> all = productRepository.findAll();
        List<String> deadUrls = new ArrayList<>();

        for (Product p : all) {
            String url = p.getUrl();
            if (url == null || url.isBlank()) continue;

            if (!isDead(url)) continue;

            // Confirm with a second check before deleting — guards against a one-off
            // network blip being mistaken for a removed product.
            sleep(2000);
            if (isDead(url)) {
                log.warn("[DeadLinkCheck] Removing id={} '{}' — 404/410 confirmed twice on {}", p.getId(), p.getName(), url);
                deadUrls.add(url);
            }

            sleep(1000);
        }

        if (!deadUrls.isEmpty()) {
            productRepository.deleteByUrlIn(deadUrls);
            log.warn("[DeadLinkCheck] Removed {} product(s) with dead links", deadUrls.size());
        } else {
            log.info("[DeadLinkCheck] No dead links found ({} products checked)", all.size());
        }

        return deadUrls;
    }

    private boolean isDead(String url) {
        try {
            int status = httpClient.connection(url)
                    .ignoreHttpErrors(true)
                    .method(Connection.Method.GET)
                    .execute()
                    .statusCode();
            return DEAD_STATUS_CODES.contains(status);
        } catch (Exception e) {
            // Network error / timeout is ambiguous, not a confirmed 404 — don't delete on it.
            log.debug("[DeadLinkCheck] Check failed for {}: {}", url, e.getMessage());
            return false;
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
