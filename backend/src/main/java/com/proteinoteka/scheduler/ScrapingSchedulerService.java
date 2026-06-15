package com.proteinoteka.scheduler;

import com.proteinoteka.model.ScrapeLog;
import com.proteinoteka.model.ScrapeStatus;
import com.proteinoteka.repository.ScrapeLogRepository;
import com.proteinoteka.service.AiDescriptionJob;
import com.proteinoteka.service.DataQualityService;
import com.proteinoteka.service.ScraperService;
import com.proteinoteka.service.StoreScraper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScrapingSchedulerService {

    private static final ZoneId BELGRADE = ZoneId.of("Europe/Belgrade");

    // Reference epoch: 2025-01-01 = cycle day 1
    private static final LocalDate CYCLE_EPOCH = LocalDate.of(2025, 1, 1);

    /**
     * 9-day rolling schedule.
     * Each entry: day number (1-9) → list of scrape windows.
     * ScrapeWindow: which stores + from what hour to what hour.
     */
    record ScrapeWindow(List<String> stores, int fromHour, int toHour) {}

    private static final Map<Integer, List<ScrapeWindow>> SCHEDULE = Map.of(
        1, List.of(new ScrapeWindow(List.of("Ogistrashop"),               8, 11)),
        2, List.of(new ScrapeWindow(List.of("Supplementshop"),            13, 16)),
        // 3 = REST
        4, List.of(new ScrapeWindow(List.of("Pansport", "FitLab"),        9, 12)),
        // 5 = REST
        6, List.of(new ScrapeWindow(List.of("Proteinbox", "Proteini.si"), 14, 17)),
        7, List.of(new ScrapeWindow(List.of("MyProtein"),                 9, 12)),
        8, List.of(new ScrapeWindow(List.of("GymBeam"),                  10, 13))
    );

    private final ScraperService scraperService;
    private final List<StoreScraper> scrapers;
    private final ScrapeLogRepository scrapeLogRepository;
    private final TaskScheduler taskScheduler;
    private final CacheManager cacheManager;
    private final AiDescriptionJob aiDescriptionJob;
    private final DataQualityService dataQualityService;

    @Value("${scraping.schedule.enabled:true}")
    private boolean schedulingEnabled;

    @Value("${app.frontend-url:https://proteinoteka.rs}")
    private String frontendUrl;

    @Value("${admin.token:}")
    private String adminToken;

    // ── Called by ScrapingScheduler every morning at 06:50 ──────────────────

    public void runDailyCheck() {
        if (!schedulingEnabled) {
            log.info("[Scheduler] Scheduling disabled — skipping daily check");
            return;
        }

        int cycleDay = currentCycleDay();
        log.info("[Scheduler] Daily check — cycle day {}/8", cycleDay);

        List<ScrapeWindow> windows = SCHEDULE.getOrDefault(cycleDay, List.of());
        if (windows.isEmpty()) {
            log.info("[Scheduler] Day {} is a REST day", cycleDay);
            return;
        }

        for (ScrapeWindow window : windows) {
            LocalTime randomTime = randomTimeInWindow(window.fromHour(), window.toHour());
            Instant scheduledAt = LocalDate.now(BELGRADE)
                    .atTime(randomTime)
                    .atZone(BELGRADE)
                    .toInstant();

            log.info("[Scheduler] Scheduling {} for {} (window {}:00–{}:00)",
                    window.stores(), randomTime, window.fromHour(), window.toHour());

            List<String> storesToScrape = window.stores();
            taskScheduler.schedule(
                    () -> executeStores(storesToScrape),
                    scheduledAt
            );
        }
    }

    // ── Public API: manual trigger from AdminController ──────────────────────

    public ScrapeLog scrapeStoreNow(String storeName) {
        StoreScraper scraper = findScraper(storeName);
        return executeWithLogging(scraper);
    }

    // ── Status ────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getStatus() {
        List<String> allStores = scrapers.stream()
                .map(StoreScraper::getStoreName)
                .sorted()
                .toList();

        int cycleDay = currentCycleDay();

        return allStores.stream().map(store -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("storeName", store);

            scrapeLogRepository.findFirstByStoreNameOrderByStartedAtDesc(store)
                    .ifPresentOrElse(
                            last -> {
                                entry.put("lastScrapeAt", last.getStartedAt());
                                entry.put("lastScrapeStatus", last.getStatus());
                                entry.put("lastProductsFound", last.getProductsFound());
                            },
                            () -> {
                                entry.put("lastScrapeAt", null);
                                entry.put("lastScrapeStatus", null);
                                entry.put("lastProductsFound", null);
                            }
                    );

            entry.put("nextScheduledAt", computeNextScheduledTime(store, cycleDay));
            return entry;
        }).toList();
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private void executeStores(List<String> storeNames) {
        for (String name : storeNames) {
            try {
                StoreScraper scraper = findScraper(name);
                executeWithLogging(scraper);
                if (storeNames.size() > 1) {
                    // Brief pause between stores in the same window
                    Thread.sleep(ThreadLocalRandom.current().nextLong(60_000, 180_000));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("[Scheduler] Error executing scrape for {}: {}", name, e.getMessage());
            }
        }
    }

    private ScrapeLog executeWithLogging(StoreScraper scraper) {
        ScrapeLog entry = new ScrapeLog(scraper.getStoreName());
        scrapeLogRepository.save(entry);

        try {
            log.info("[Scheduler] Starting scrape: {}", scraper.getStoreName());
            List<com.proteinoteka.model.Product> products = scraperService.scrapeStore(scraper);

            entry.setProductsFound(products.size());
            entry.setStatus(products.isEmpty() ? ScrapeStatus.BLOCKED : ScrapeStatus.SUCCESS);
            log.info("[Scheduler] Finished scrape: {} — {} products ({})",
                    scraper.getStoreName(), products.size(), entry.getStatus());

            if (entry.getStatus() == ScrapeStatus.SUCCESS) {
                evictProductCaches();
                aiDescriptionJob.enrichAllMissingDescriptions();
                triggerFrontendRevalidation();
                dataQualityService.checkOutliers();
            }

        } catch (Exception e) {
            entry.setStatus(ScrapeStatus.FAILED);
            entry.setErrorMessage(e.getMessage() != null
                    ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 500))
                    : "Unknown error");
            log.error("[Scheduler] Scrape FAILED for {}: {}", scraper.getStoreName(), e.getMessage());
        } finally {
            entry.setFinishedAt(LocalDateTime.now());
            scrapeLogRepository.save(entry);
        }

        return entry;
    }

    private void triggerFrontendRevalidation() {
        if (adminToken.isBlank()) {
            log.warn("[Scheduler] ADMIN_TOKEN not set — skipping frontend revalidation");
            return;
        }
        try {
            var client = java.net.http.HttpClient.newHttpClient();
            var request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(frontendUrl + "/api/revalidate"))
                    .header("Authorization", "Bearer " + adminToken)
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.noBody())
                    .build();
            var response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            log.info("[Scheduler] Frontend revalidation: HTTP {} — {}", response.statusCode(), response.body());
        } catch (Exception e) {
            log.warn("[Scheduler] Frontend revalidation failed: {}", e.getMessage());
        }
    }

    private void evictProductCaches() {
        java.util.List.of("products", "products-meta", "products-search", "price-drops").forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) cache.clear();
        });
        log.info("[Cache] Product caches evicted after scrape");
    }

    private StoreScraper findScraper(String name) {
        return scrapers.stream()
                .filter(s -> s.getStoreName().equalsIgnoreCase(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown store: " + name));
    }

    public int currentCycleDay() {
        long days = ChronoUnit.DAYS.between(CYCLE_EPOCH, LocalDate.now(BELGRADE));
        return (int)(days % 8) + 1; // 1–8
    }

    private LocalTime randomTimeInWindow(int fromHour, int toHour) {
        int totalMinutes = (toHour - fromHour) * 60;
        int offsetMinutes = ThreadLocalRandom.current().nextInt(totalMinutes);
        return LocalTime.of(fromHour, 0).plusMinutes(offsetMinutes);
    }

    private String computeNextScheduledTime(String storeName, int todayCycleDay) {
        for (int offset = 0; offset < 8; offset++) {
            int checkDay = (todayCycleDay - 1 + offset) % 8 + 1;
            List<ScrapeWindow> windows = SCHEDULE.getOrDefault(checkDay, List.of());
            for (ScrapeWindow w : windows) {
                if (w.stores().stream().anyMatch(s -> s.equalsIgnoreCase(storeName))) {
                    LocalDate date = LocalDate.now(BELGRADE).plusDays(offset);
                    // midpoint of window as estimate
                    LocalTime mid = LocalTime.of((w.fromHour() + w.toHour()) / 2, 0);
                    return date.atTime(mid).toString();
                }
            }
        }
        return "unknown";
    }
}
