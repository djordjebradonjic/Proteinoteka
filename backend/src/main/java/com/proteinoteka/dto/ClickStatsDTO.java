package com.proteinoteka.dto;

import java.util.List;

public record ClickStatsDTO(
        List<StoreClickDTO> clicksPerStore,
        List<ProductClickDTO> topProducts,
        List<DayClickDTO> clicksLast7Days
) {
    public record StoreClickDTO(String storeName, long count) {}
    public record ProductClickDTO(long productId, String productName, long count) {}
    public record DayClickDTO(String date, long count) {}
}
