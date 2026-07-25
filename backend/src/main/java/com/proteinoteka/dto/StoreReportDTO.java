package com.proteinoteka.dto;

import java.time.LocalDate;
import java.util.List;

public record StoreReportDTO(
        String storeName,
        String market,
        LocalDate periodStart,
        LocalDate periodEnd,
        int periodDays,
        Engagement engagement,
        PricePositionSummary pricePositionSummary,
        List<ProductPricePosition> pricePositions,
        List<PriceVelocity> priceVelocity,
        RatingSummary ratingSummary,
        List<BrandScore> brandScores,
        List<SearchTerm> topSearchTerms,
        List<String> missedOpportunityBrands,
        LostClicksEstimate lostClicksEstimate
) {
    public record Engagement(long productViews, long buyClicks, long compareClicks) {}

    public record PricePositionSummary(
            int groupedProductCount,
            int cheapestCount,
            double avgPctAboveCheapest
    ) {}

    public record ProductPricePosition(
            Long productId,
            String productName,
            double yourPrice,
            double cheapestPrice,
            String cheapestStore,
            int yourRank,
            int totalStoresInGroup,
            double pctAboveCheapest
    ) {}

    public record PriceVelocity(Long productId, String productName, int changeCount) {}

    public record RatingSummary(Double avgRating, long reviewCount) {}

    public record BrandScore(String brand, double score, String tier) {}

    public record SearchTerm(String term, long count) {}

    // Estimate only — correlated by IP address + a time window, not by verified user
    // identity (the site has no login/session system). Treat as directional evidence of
    // lost sales, not an exact attribution.
    public record LostClicksEstimate(
            long estimatedCount,
            List<LostClickDetail> byCompetitor
    ) {}

    public record LostClickDetail(String productName, String competitorStore, long count) {}
}
