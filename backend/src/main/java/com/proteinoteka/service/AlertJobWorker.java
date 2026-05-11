package com.proteinoteka.service;

import com.proteinoteka.dto.PriceAlertEmailData;
import com.proteinoteka.model.AlertJob;
import com.proteinoteka.model.AlertStatus;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.WishlistItem;
import com.proteinoteka.repository.AlertJobRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class AlertJobWorker {

    // Hard cap per run: protects against scraper bugs causing email blasts
    private static final int MAX_EMAILS_PER_RUN = 50;

    private final AlertJobRepository alertJobRepo;
    private final WishlistItemRepository wishlistItemRepo;
    private final ProductRepository productRepo;
    private final EmailService emailService;

    /**
     * Runs every 5 minutes. Picks up PENDING jobs (and FAILED jobs with retries left),
     * sends emails, updates statuses and cooldown timestamps.
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void processAlertJobs() {
        List<AlertJob> jobs = alertJobRepo.findJobsDueForProcessing(
                AlertStatus.PENDING,
                AlertStatus.FAILED,
                PageRequest.of(0, MAX_EMAILS_PER_RUN)
        );

        if (jobs.isEmpty()) return;

        log.info("[AlertWorker] Processing {} alert jobs (cap: {})", jobs.size(), MAX_EMAILS_PER_RUN);

        for (AlertJob job : jobs) {
            processJob(job);
        }

        long pending = alertJobRepo.countByStatus(AlertStatus.PENDING);
        long failed  = alertJobRepo.countByStatus(AlertStatus.FAILED);
        if (pending > 0 || failed > 0) {
            log.info("[AlertWorker] Queue remaining: {} PENDING, {} FAILED", pending, failed);
        }
    }

    private void processJob(AlertJob job) {
        Optional<Product> productOpt = productRepo.findById(job.getProductId());
        if (productOpt.isEmpty()) {
            failJob(job, "Product not found: " + job.getProductId());
            return;
        }

        Optional<WishlistItem> itemOpt = wishlistItemRepo.findById(job.getWishlistItemId());
        if (itemOpt.isEmpty()) {
            // Wishlist item was deleted (user unsubscribed) — no need to send
            failJob(job, "Wishlist item not found (user likely unsubscribed)");
            return;
        }

        Product product = productOpt.get();
        WishlistItem item = itemOpt.get();

        PriceAlertEmailData emailData = new PriceAlertEmailData(
                job.getId(),
                job.getEmail(),
                job.getProductId(),
                product.getName(),
                product.getImageUrl(),
                job.getOldPrice().doubleValue(),
                job.getNewPrice().doubleValue(),
                job.getPercentageDrop().doubleValue(),
                job.is30dLow(),
                item.getUnsubscribeToken()
        );

        try {
            emailService.sendPriceAlert(emailData);
            markSent(job, item);
        } catch (Exception e) {
            log.error("[AlertWorker] Failed to send job {} to {}: {}", job.getId(), job.getEmail(), e.getMessage());
            failJob(job, truncate(e.getMessage(), 500));
        }
    }

    private void markSent(AlertJob job, WishlistItem item) {
        job.setStatus(AlertStatus.SENT);
        job.setSentAt(LocalDateTime.now());
        alertJobRepo.save(job);

        item.setLastNotifiedAt(LocalDateTime.now());
        wishlistItemRepo.save(item);
    }

    private void failJob(AlertJob job, String reason) {
        job.setStatus(AlertStatus.FAILED);
        job.setSentAt(LocalDateTime.now());
        job.setFailureReason(reason);
        job.setRetryCount(job.getRetryCount() + 1);
        alertJobRepo.save(job);
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
