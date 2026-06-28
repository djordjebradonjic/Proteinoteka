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
        "https://www.proteinoteka.rs",
        "https://proteinoteka.com.hr",
        "https://www.proteinoteka.com.hr"
})
public class ClickStatsController {

    private final ClickEventRepository    clickEventRepository;
    private final TrackingEventRepository trackingEventRepository;

    @GetMapping("/clicks/stats")
    public ClickStatsDTO getStats(@RequestParam(required = false) String market) {
        // market = null → sve (oba tržišta), "rs" ili "hr" → filtrirano
        final String m = (market != null && !market.isBlank()) ? market : null;

        // ── CLICK_OUT (legacy click_events table) ────────────────────────
        List<ClickStatsDTO.StoreClickDTO> clicksPerStore = (m == null
                ? clickEventRepository.clicksPerStore()
                : clickEventRepository.clicksPerStoreByMarket(m))
                .stream()
                .map(row -> new ClickStatsDTO.StoreClickDTO(
                        (String) row[0],
                        ((Number) row[1]).longValue()))
                .toList();

        List<ClickStatsDTO.ProductClickDTO> topProducts = (m == null
                ? clickEventRepository.topProducts()
                : clickEventRepository.topProductsByMarket(m))
                .stream()
                .map(row -> new ClickStatsDTO.ProductClickDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<ClickStatsDTO.DayClickDTO> clicksLast7Days = (m == null
                ? clickEventRepository.clicksLast7Days()
                : clickEventRepository.clicksLast7DaysByMarket(m))
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()))
                .toList();

        long totalClickOuts = m == null
                ? clickEventRepository.count()
                : clickEventRepository.countByMarket(m);

        // ── PRODUCT_VIEW ─────────────────────────────────────────────────
        List<ClickStatsDTO.DayClickDTO> viewsLast7Days = (m == null
                ? trackingEventRepository.dailyCountsLast7Days("PRODUCT_VIEW")
                : trackingEventRepository.dailyCountsLast7DaysByMarket("PRODUCT_VIEW", m))
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()))
                .toList();

        List<ClickStatsDTO.ProductClickDTO> topViewedProducts = (m == null
                ? trackingEventRepository.topProductsByEventType("PRODUCT_VIEW")
                : trackingEventRepository.topProductsByEventTypeAndMarket("PRODUCT_VIEW", m))
                .stream()
                .map(row -> new ClickStatsDTO.ProductClickDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        long totalViews = m == null
                ? trackingEventRepository.countByEventType("PRODUCT_VIEW")
                : trackingEventRepository.countByEventTypeAndMarket("PRODUCT_VIEW", m);

        // ── COMPARE_CLICK ─────────────────────────────────────────────────
        List<ClickStatsDTO.DayClickDTO> compareLast7Days = (m == null
                ? trackingEventRepository.dailyCountsLast7Days("COMPARE_CLICK")
                : trackingEventRepository.dailyCountsLast7DaysByMarket("COMPARE_CLICK", m))
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()))
                .toList();

        long totalCompares = m == null
                ? trackingEventRepository.countByEventType("COMPARE_CLICK")
                : trackingEventRepository.countByEventTypeAndMarket("COMPARE_CLICK", m);

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
