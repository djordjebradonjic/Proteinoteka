package com.proteinoteka.dto;

import java.util.List;

public record ClickStatsDTO(
        // CLICK_OUT (buy button)
        List<StoreClickDTO>   clicksPerStore,
        List<ProductClickDTO> topProducts,
        List<DayClickDTO>     clicksLast7Days,
        long                  totalClickOuts,

        // PRODUCT_VIEW
        List<DayClickDTO>     viewsLast7Days,
        List<ProductClickDTO> topViewedProducts,
        long                  totalViews,

        // COMPARE_CLICK
        List<DayClickDTO>     compareLast7Days,
        long                  totalCompares
) {
    public record StoreClickDTO(String storeName, long count) {}
    public record ProductClickDTO(long productId, String productName, long count) {}
    public record DayClickDTO(String date, long count) {}
}
