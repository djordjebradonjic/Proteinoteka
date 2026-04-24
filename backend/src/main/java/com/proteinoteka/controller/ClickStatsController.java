package com.proteinoteka.controller;

import com.proteinoteka.dto.ClickStatsDTO;
import com.proteinoteka.repository.ClickEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class ClickStatsController {

    private final ClickEventRepository clickEventRepository;

    @GetMapping("/clicks/stats")
    public ClickStatsDTO getStats() {
        List<ClickStatsDTO.StoreClickDTO> clicksPerStore = clickEventRepository.clicksPerStore()
                .stream()
                .map(row -> new ClickStatsDTO.StoreClickDTO(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();

        List<ClickStatsDTO.ProductClickDTO> topProducts = clickEventRepository.topProducts()
                .stream()
                .map(row -> new ClickStatsDTO.ProductClickDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()
                ))
                .toList();

        List<ClickStatsDTO.DayClickDTO> clicksLast7Days = clickEventRepository.clicksLast7Days()
                .stream()
                .map(row -> new ClickStatsDTO.DayClickDTO(
                        row[0].toString(),
                        ((Number) row[1]).longValue()
                ))
                .toList();

        return new ClickStatsDTO(clicksPerStore, topProducts, clicksLast7Days);
    }
}
