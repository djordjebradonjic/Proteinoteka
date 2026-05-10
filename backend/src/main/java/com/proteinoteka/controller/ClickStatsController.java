package com.proteinoteka.controller;

import com.proteinoteka.dto.ClickStatsDTO;
import com.proteinoteka.repository.ClickEventRepository;
import com.proteinoteka.repository.TrackingEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class ClickStatsController {

    private final ClickEventRepository    clickEventRepository;
    private final TrackingEventRepository trackingEventRepository;

    @GetMapping("/clicks/stats")
    public ClickStatsDTO getStats() {
        // ── CLICK_OUT (legacy click_events table) ────────────────────────
        List<ClickStatsDTO.StoreClickDTO> clicksPerStore = clickEventRepository.clicksPerStore()
                .stream()
                .map(row -> new ClickStatsDTO.StoreClickDTO(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .toList();

        List<ClickStatsDTO.ProductClickDTO> topProducts = clickEventRepository.topProducts()
                .stream()
                .map(row -> new ClickStatsDTO.ProductClickDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<ClickStatsDTO.DayClickDTO> clicksLast7Days = clickEventRepository.clicksLast7Days()
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()))
                .toList();

        long totalClickOuts = clicksPerStore.stream().mapToLong(ClickStatsDTO.StoreClickDTO::count).sum();

        // ── PRODUCT_VIEW ─────────────────────────────────────────────────
        List<ClickStatsDTO.DayClickDTO> viewsLast7Days = trackingEventRepository
                .dailyCountsLast7Days("PRODUCT_VIEW")
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()))
                .toList();

        List<ClickStatsDTO.ProductClickDTO> topViewedProducts = trackingEventRepository
                .topProductsByEventType("PRODUCT_VIEW")
                .stream()
                .map(row -> new ClickStatsDTO.ProductClickDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        long totalViews = trackingEventRepository.countByEventType("PRODUCT_VIEW");

        // ── COMPARE_CLICK ─────────────────────────────────────────────────
        List<ClickStatsDTO.DayClickDTO> compareLast7Days = trackingEventRepository
                .dailyCountsLast7Days("COMPARE_CLICK")
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()))
                .toList();

        long totalCompares = trackingEventRepository.countByEventType("COMPARE_CLICK");

        return new ClickStatsDTO(
                clicksPerStore, topProducts, clicksLast7Days, totalClickOuts,
                viewsLast7Days, topViewedProducts, totalViews,
                compareLast7Days, totalCompares
        );
    }

    @DeleteMapping("/tracking")
    public Map<String, String> clearTracking(
            @RequestParam(defaultValue = "false") boolean keepClickOut) {
        if (keepClickOut) {
            trackingEventRepository.deleteAllExceptClickOut();
            return Map.of("deleted", "all except CLICK_OUT");
        }
        trackingEventRepository.deleteAll();
        return Map.of("deleted", "all");
    }

    @DeleteMapping("/clicks")
    public Map<String, String> clearClickEvents() {
        clickEventRepository.deleteAll();
        return Map.of("deleted", "click_events");
    }
}
