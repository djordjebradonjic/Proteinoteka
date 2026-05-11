package com.proteinoteka.service;

import com.proteinoteka.event.PriceDropEvent;
import com.proteinoteka.model.AlertJob;
import com.proteinoteka.model.WishlistItem;
import com.proteinoteka.repository.AlertJobRepository;
import com.proteinoteka.repository.PriceHistoryRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PriceAlertService {

    private static final int COOLDOWN_DAYS = 7;

    private final WishlistItemRepository wishlistItemRepo;
    private final AlertJobRepository alertJobRepo;
    private final PriceHistoryRepository priceHistoryRepo;

    /**
     * Runs in a separate thread after the scraper transaction commits.
     * Creates PENDING alert jobs for eligible subscribers — no emails sent here.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional
    public void onPriceDrop(PriceDropEvent event) {
        log.info("[PriceAlert] Processing drop for product {} | {}% drop | {} -> {} RSD",
                event.productId(), String.format("%.1f", event.percentageDrop()),
                event.oldPrice(), event.newPrice());

        LocalDateTime cooldownThreshold = LocalDateTime.now().minusDays(COOLDOWN_DAYS);
        List<WishlistItem> eligible = wishlistItemRepo.findEligibleForAlert(event.productId(), cooldownThreshold);

        if (eligible.isEmpty()) {
            log.info("[PriceAlert] No eligible subscribers for product {}", event.productId());
            return;
        }

        boolean is30dLow = is30DayLow(event.productId(), event.newPrice());

        List<AlertJob> jobs = eligible.stream()
                .filter(item -> meetsTargetPrice(item, event.newPrice()))
                .map(item -> buildJob(item, event, is30dLow))
                .toList();

        if (jobs.isEmpty()) {
            log.info("[PriceAlert] All {} subscribers filtered out by target_price for product {}",
                    eligible.size(), event.productId());
            return;
        }

        alertJobRepo.saveAll(jobs);
        log.info("[PriceAlert] Created {} PENDING alert jobs for product {}", jobs.size(), event.productId());
    }

    private boolean meetsTargetPrice(WishlistItem item, double newPrice) {
        if (item.getTargetPrice() == null) return true;
        return newPrice <= item.getTargetPrice().doubleValue();
    }

    private boolean is30DayLow(Long productId, double newPrice) {
        return priceHistoryRepo
                .findMinPriceInLast30Days(productId, LocalDateTime.now().minusDays(30))
                .map(min -> newPrice <= min)
                .orElse(false);
    }

    private AlertJob buildJob(WishlistItem item, PriceDropEvent event, boolean is30dLow) {
        AlertJob job = new AlertJob();
        job.setWishlistItemId(item.getId());
        job.setProductId(event.productId());
        job.setEmail(item.getEmail());
        job.setOldPrice(BigDecimal.valueOf(event.oldPrice()));
        job.setNewPrice(BigDecimal.valueOf(event.newPrice()));
        job.setPercentageDrop(BigDecimal.valueOf(event.percentageDrop()));
        job.set30dLow(is30dLow);
        return job;
    }
}
