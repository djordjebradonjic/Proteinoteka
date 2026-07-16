package com.proteinoteka.controller;

import com.proteinoteka.dto.CalculatorSubscribeRequest;
import com.proteinoteka.dto.CalculatorStatsDTO;
import com.proteinoteka.model.CalculatorSubscriber;
import com.proteinoteka.repository.CalculatorSubscriberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class CalculatorController {

    private final CalculatorSubscriberRepository repo;

    @PostMapping("/api/v1/calculator/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody CalculatorSubscribeRequest req) {
        if (req.email() == null || !req.email().contains("@")) {
            return ResponseEntity.badRequest().build();
        }

        String email = req.email().toLowerCase().trim();
        String market = (req.market() == null || req.market().isEmpty()) ? "rs" : req.market();

        repo.findByEmail(email).ifPresentOrElse(existing -> {
            existing.setName(req.name());
            existing.setGoal(req.goal());
            existing.setProtein(req.protein());
            existing.setCalories(req.calories());
            existing.setCarbs(req.carbs());
            existing.setFat(req.fat());
            existing.setUpdatedAt(LocalDateTime.now());
            repo.save(existing);
        }, () -> {
            CalculatorSubscriber sub = new CalculatorSubscriber();
            sub.setEmail(email);
            sub.setName(req.name());
            sub.setGoal(req.goal());
            sub.setProtein(req.protein());
            sub.setCalories(req.calories());
            sub.setCarbs(req.carbs());
            sub.setFat(req.fat());
            sub.setMarket(market);
            repo.save(sub);
        });

        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/v1/admin/calculator/stats")
    public ResponseEntity<CalculatorStatsDTO> stats() {
        long total = repo.count();

        Map<String, Long> byGoal = repo.countByGoalGrouped().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        Map<String, Long> byMarket = repo.countByMarketGrouped().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1],
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        List<CalculatorStatsDTO.RecentSubscriber> recent = repo.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(s -> new CalculatorStatsDTO.RecentSubscriber(
                        s.getEmail(), s.getName(), s.getGoal(), s.getMarket(), s.getCreatedAt()))
                .toList();

        return ResponseEntity.ok(new CalculatorStatsDTO(total, byGoal, byMarket, recent));
    }
}
