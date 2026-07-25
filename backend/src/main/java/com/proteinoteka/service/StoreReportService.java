package com.proteinoteka.service;

import com.proteinoteka.dto.StorePriceDTO;
import com.proteinoteka.dto.StoreReportDTO;
import com.proteinoteka.model.BrandReputation;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.BrandReputationRepository;
import com.proteinoteka.repository.ClickEventRepository;
import com.proteinoteka.repository.PriceHistoryRepository;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.ReviewRepository;
import com.proteinoteka.repository.StoreRepository;
import com.proteinoteka.repository.TrackingEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds the monthly competitive-intelligence report sold to individual stores: where they
 * stand on price against other stores selling the same product, search demand in the
 * category, brand reputation, review standing, repricing frequency, and an estimate of
 * sales lost to competitors.
 *
 * Every number here is derived from data already collected for the site's own operation
 * (click/view tracking, price history, reviews, brand reputation) — nothing new is
 * collected specifically for this report.
 */
@Service
@RequiredArgsConstructor
public class StoreReportService {

    // Correlation window for the lost-clicks estimate: a competitor click counts as
    // "lost" if it happens within this many hours after a view of the same product group
    // on the target store's own listing, from the same IP. There is no login/session
    // system on the site, so IP + time proximity is the closest available signal — this
    // is deliberately a conservative estimate, not exact user-level attribution.
    private static final int LOST_CLICK_WINDOW_HOURS = 72;
    private static final int TOP_SEARCH_TERMS_FOR_DISPLAY = 20;
    private static final int TOP_SEARCH_TERMS_FOR_BRAND_MATCH = 50;
    private static final int MAX_MISSED_OPPORTUNITY_BRANDS = 10;

    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final ClickEventRepository clickEventRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final ReviewRepository reviewRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final BrandReputationRepository brandReputationRepository;
    private final ProductGroupService productGroupService;

    public StoreReportDTO generateReport(String storeName, int days) {
        Store store = storeRepository.findByName(storeName)
                .orElseThrow(() -> new IllegalArgumentException("Unknown store: " + storeName));

        LocalDateTime since = LocalDateTime.now().minusDays(days);
        LocalDate periodEnd = LocalDate.now();
        LocalDate periodStart = periodEnd.minusDays(days);

        List<Product> storeProducts = productRepository
                .findByStoreNameIgnoreCase(storeName, Pageable.unpaged())
                .getContent();

        List<StoreReportDTO.ProductPricePosition> pricePositions = buildPricePositions(storeName, storeProducts);

        return new StoreReportDTO(
                storeName,
                store.getMarket(),
                periodStart,
                periodEnd,
                days,
                buildEngagement(storeName, since),
                buildPriceSummary(pricePositions),
                pricePositions,
                buildPriceVelocity(storeName, since),
                buildRatingSummary(storeName),
                buildBrandScores(storeName),
                buildTopSearchTerms(),
                missedOpportunityBrands(storeName),
                buildLostClicksEstimate(storeName, storeProducts, since)
        );
    }

    // ── Engagement ────────────────────────────────────────────────────────────

    private StoreReportDTO.Engagement buildEngagement(String storeName, LocalDateTime since) {
        long views = trackingEventRepository.countByEventTypeAndStoreSince("PRODUCT_VIEW", storeName, since);
        long buyClicks = clickEventRepository.countByStoreNameSince(storeName, since);
        long compares = trackingEventRepository.countByEventTypeAndStoreSince("COMPARE_CLICK", storeName, since);
        return new StoreReportDTO.Engagement(views, buyClicks, compares);
    }

    // ── Price positioning ────────────────────────────────────────────────────

    private List<StoreReportDTO.ProductPricePosition> buildPricePositions(String storeName, List<Product> storeProducts) {
        List<StoreReportDTO.ProductPricePosition> positions = new ArrayList<>();

        for (Product product : storeProducts) {
            if (product.getGroupId() == null) continue;

            List<StorePriceDTO> groupPrices = productGroupService.getStorePrices(product.getId());
            if (groupPrices.size() <= 1) continue; // no competing store in this group

            int rank = -1;
            double yourPrice = 0;
            for (int i = 0; i < groupPrices.size(); i++) {
                if (groupPrices.get(i).storeName().equalsIgnoreCase(storeName)) {
                    rank = i + 1;
                    yourPrice = groupPrices.get(i).numericPrice() != null ? groupPrices.get(i).numericPrice() : 0;
                    break;
                }
            }
            if (rank == -1) continue;

            StorePriceDTO cheapest = groupPrices.get(0);
            double cheapestPrice = cheapest.numericPrice() != null ? cheapest.numericPrice() : 0;
            double pctAboveCheapest = cheapestPrice > 0 ? ((yourPrice - cheapestPrice) / cheapestPrice) * 100 : 0;

            positions.add(new StoreReportDTO.ProductPricePosition(
                    product.getId(),
                    product.getName(),
                    yourPrice,
                    cheapestPrice,
                    cheapest.storeName(),
                    rank,
                    groupPrices.size(),
                    pctAboveCheapest
            ));
        }

        positions.sort(Comparator.comparingDouble(StoreReportDTO.ProductPricePosition::pctAboveCheapest).reversed());
        return positions;
    }

    private StoreReportDTO.PricePositionSummary buildPriceSummary(List<StoreReportDTO.ProductPricePosition> positions) {
        int cheapestCount = (int) positions.stream().filter(p -> p.yourRank() == 1).count();
        double avgPct = positions.isEmpty() ? 0
                : positions.stream().mapToDouble(StoreReportDTO.ProductPricePosition::pctAboveCheapest).average().orElse(0);
        return new StoreReportDTO.PricePositionSummary(positions.size(), cheapestCount, avgPct);
    }

    // ── Price change velocity ────────────────────────────────────────────────

    private List<StoreReportDTO.PriceVelocity> buildPriceVelocity(String storeName, LocalDateTime since) {
        return priceHistoryRepository.priceChangeCountsByStoreName(storeName, since).stream()
                .map(row -> new StoreReportDTO.PriceVelocity(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).intValue()))
                .toList();
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    private StoreReportDTO.RatingSummary buildRatingSummary(String storeName) {
        List<Object[]> rows = reviewRepository.ratingSummaryByStoreName(storeName);
        if (rows.isEmpty()) return new StoreReportDTO.RatingSummary(null, 0);
        Object[] row = rows.get(0);
        Double avg = row[0] != null ? ((Number) row[0]).doubleValue() : null;
        long count = row[1] != null ? ((Number) row[1]).longValue() : 0;
        return new StoreReportDTO.RatingSummary(avg, count);
    }

    // ── Brand reputation ─────────────────────────────────────────────────────

    private List<StoreReportDTO.BrandScore> buildBrandScores(String storeName) {
        List<String> brands = productRepository.findDistinctBrandsByStoreName(storeName);
        List<StoreReportDTO.BrandScore> scores = new ArrayList<>();
        for (String brand : brands) {
            brandReputationRepository.findFirstByBrandNameIgnoreCase(brand).ifPresent(rep ->
                    scores.add(new StoreReportDTO.BrandScore(brand, rep.getScore(), rep.getTier())));
        }
        scores.sort(Comparator.comparingDouble(StoreReportDTO.BrandScore::score).reversed());
        return scores;
    }

    // ── Search demand ─────────────────────────────────────────────────────────

    private List<StoreReportDTO.SearchTerm> buildTopSearchTerms() {
        return topSearchRows(TOP_SEARCH_TERMS_FOR_DISPLAY);
    }

    private List<StoreReportDTO.SearchTerm> topSearchRows(int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        return trackingEventRepository.topSearchQueriesSince(since, limit).stream()
                .map(row -> new StoreReportDTO.SearchTerm((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }

    // ── Missed-opportunity brands ────────────────────────────────────────────

    private List<String> missedOpportunityBrands(String storeName) {
        Set<String> storeBrands = productRepository.findDistinctBrandsByStoreName(storeName).stream()
                .map(b -> b.toLowerCase().trim())
                .collect(Collectors.toSet());

        List<String> topTerms = topSearchRows(TOP_SEARCH_TERMS_FOR_BRAND_MATCH).stream()
                .map(t -> t.term().toLowerCase())
                .toList();

        List<BrandReputation> allBrands = brandReputationRepository.findAll();
        Set<String> matched = new HashSet<>();
        List<String> result = new ArrayList<>();

        for (BrandReputation brand : allBrands) {
            String brandLower = brand.getBrandName().toLowerCase().trim();
            if (brandLower.isBlank() || storeBrands.contains(brandLower)) continue;
            if (matched.contains(brandLower)) continue;

            boolean searchedFor = topTerms.stream().anyMatch(term -> term.contains(brandLower));
            if (searchedFor) {
                matched.add(brandLower);
                result.add(brand.getBrandName());
                if (result.size() >= MAX_MISSED_OPPORTUNITY_BRANDS) break;
            }
        }
        return result;
    }

    // ── Lost clicks to competitors (IP + time-window estimate) ─────────────────

    private StoreReportDTO.LostClicksEstimate buildLostClicksEstimate(String storeName, List<Product> storeProducts, LocalDateTime since) {
        Map<Long, Long> productIdToGroupId = storeProducts.stream()
                .filter(p -> p.getGroupId() != null)
                .collect(Collectors.toMap(Product::getId, Product::getGroupId, (a, b) -> a));

        if (productIdToGroupId.isEmpty()) {
            return new StoreReportDTO.LostClicksEstimate(0, List.of());
        }

        // (groupId, ip) -> earliest view time on OUR listing for that group
        Map<String, LocalDateTime> viewsByGroupAndIp = new HashMap<>();
        for (Object[] row : trackingEventRepository.productViewRowsForProducts(productIdToGroupId.keySet(), since)) {
            Long productId = ((Number) row[0]).longValue();
            String ip = (String) row[1];
            LocalDateTime viewedAt = toLocalDateTime(row[2]);
            Long groupId = productIdToGroupId.get(productId);
            if (groupId == null || ip == null || viewedAt == null) continue;

            String key = groupId + "|" + ip;
            viewsByGroupAndIp.merge(key, viewedAt, (a, b) -> a.isBefore(b) ? a : b);
        }

        if (viewsByGroupAndIp.isEmpty()) {
            return new StoreReportDTO.LostClicksEstimate(0, List.of());
        }

        // Sibling products (same group, different store) across the whole catalog.
        Map<Long, Long> siblingProductIdToGroupId = new HashMap<>();
        Map<Long, String> siblingProductIdToName = new HashMap<>();
        for (Long groupId : new HashSet<>(productIdToGroupId.values())) {
            for (Product sibling : productRepository.findByGroupId(groupId)) {
                if (sibling.getStore() == null || sibling.getStore().getName().equalsIgnoreCase(storeName)) continue;
                siblingProductIdToGroupId.put(sibling.getId(), groupId);
                siblingProductIdToName.put(sibling.getId(), sibling.getName());
            }
        }

        if (siblingProductIdToGroupId.isEmpty()) {
            return new StoreReportDTO.LostClicksEstimate(0, List.of());
        }

        // Our own product names per group, for readable report lines ("you likely lost
        // sales on THIS listing of yours").
        Map<Long, String> groupIdToOurProductName = storeProducts.stream()
                .filter(p -> p.getGroupId() != null)
                .collect(Collectors.toMap(Product::getGroupId, Product::getName, (a, b) -> a));

        Set<String> dedupeKeys = new HashSet<>();
        Map<String, Long> countByCompetitor = new LinkedHashMap<>();
        Map<String, Long> countByProductAndCompetitor = new LinkedHashMap<>();

        for (Object[] row : clickEventRepository.clickRowsForProducts(siblingProductIdToGroupId.keySet(), since)) {
            Long clickedProductId = ((Number) row[0]).longValue();
            String ip = (String) row[1];
            LocalDateTime clickedAt = toLocalDateTime(row[2]);
            String competitorStore = (String) row[3];
            Long groupId = siblingProductIdToGroupId.get(clickedProductId);
            if (groupId == null || ip == null || clickedAt == null || competitorStore == null) continue;

            LocalDateTime viewedAt = viewsByGroupAndIp.get(groupId + "|" + ip);
            if (viewedAt == null) continue;
            if (clickedAt.isBefore(viewedAt)) continue;
            if (java.time.Duration.between(viewedAt, clickedAt).toHours() > LOST_CLICK_WINDOW_HOURS) continue;

            // At most one counted "loss" per (ip, group, competitor, day) so repeated
            // browsing in one session doesn't inflate the estimate.
            String dedupeKey = ip + "|" + groupId + "|" + competitorStore + "|" + clickedAt.toLocalDate();
            if (!dedupeKeys.add(dedupeKey)) continue;

            countByCompetitor.merge(competitorStore, 1L, Long::sum);
            String ourProductName = groupIdToOurProductName.getOrDefault(groupId, siblingProductIdToName.get(clickedProductId));
            countByProductAndCompetitor.merge(ourProductName + "|" + competitorStore, 1L, Long::sum);
        }

        List<StoreReportDTO.LostClickDetail> details = countByProductAndCompetitor.entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("\\|", 2);
                    return new StoreReportDTO.LostClickDetail(parts[0], parts[1], e.getValue());
                })
                .sorted(Comparator.comparingLong(StoreReportDTO.LostClickDetail::count).reversed())
                .limit(15)
                .toList();

        long total = countByCompetitor.values().stream().mapToLong(Long::longValue).sum();
        return new StoreReportDTO.LostClicksEstimate(total, details);
    }

    private static LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof LocalDateTime ldt) return ldt;
        if (value instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
        return null;
    }
}
