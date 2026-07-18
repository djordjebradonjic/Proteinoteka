package com.proteinoteka.controller;

import com.proteinoteka.dto.NewsletterActiveSubscriberDTO;
import com.proteinoteka.dto.NewsletterCampaignDTO;
import com.proteinoteka.dto.NewsletterCampaignRequest;
import com.proteinoteka.dto.NewsletterStatsDTO;
import com.proteinoteka.dto.NewsletterSubscribeRequest;
import com.proteinoteka.model.NewsletterCampaign;
import com.proteinoteka.model.NewsletterSubscriber;
import com.proteinoteka.repository.NewsletterCampaignRepository;
import com.proteinoteka.repository.NewsletterSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs",
        "https://proteinoteka.com.hr",
        "https://www.proteinoteka.com.hr"
})
@Slf4j
public class NewsletterController {

    private final NewsletterSubscriberRepository repo;
    private final NewsletterCampaignRepository campaignRepo;

    @Value("${app.frontend-url:https://proteinoteka.rs}")
    private String frontendUrl;

    private static final Map<String, String> MARKET_FRONTEND_URLS = Map.of(
            "rs", "https://proteinoteka.rs",
            "hr", "https://proteinoteka.com.hr"
    );

    @PostMapping("/api/v1/newsletter/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody NewsletterSubscribeRequest req) {
        if (req.email() == null || !req.email().contains("@")) {
            return ResponseEntity.badRequest().build();
        }

        String email = req.email().toLowerCase().trim();
        String market = (req.market() == null || req.market().isEmpty()) ? "rs" : req.market();

        repo.findByEmail(email).ifPresentOrElse(existing -> {
            existing.setActive(true);
            if (req.source() != null) {
                existing.setSource(req.source());
            }
            existing.setUpdatedAt(LocalDateTime.now());
            repo.save(existing);
        }, () -> {
            NewsletterSubscriber sub = new NewsletterSubscriber();
            sub.setEmail(email);
            sub.setMarket(market);
            sub.setSource(req.source());
            repo.save(sub);
        });

        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/v1/admin/newsletter/stats")
    public ResponseEntity<NewsletterStatsDTO> stats() {
        long total = repo.count();

        Map<String, Long> bySource = repo.countBySourceGrouped().stream()
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

        List<NewsletterStatsDTO.RecentSubscriber> recent = repo.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(s -> new NewsletterStatsDTO.RecentSubscriber(
                        s.getEmail(), s.getSource(), s.getMarket(), s.getCreatedAt()))
                .toList();

        return ResponseEntity.ok(new NewsletterStatsDTO(total, bySource, byMarket, recent));
    }

    @GetMapping("/api/v1/admin/newsletter/active-subscribers")
    public ResponseEntity<List<NewsletterActiveSubscriberDTO>> activeSubscribers(@RequestParam String market) {
        List<NewsletterActiveSubscriberDTO> subscribers = repo.findByMarketAndActiveTrue(market).stream()
                .map(s -> new NewsletterActiveSubscriberDTO(s.getEmail(), s.getUnsubscribeToken()))
                .toList();
        return ResponseEntity.ok(subscribers);
    }

    @PostMapping("/api/v1/admin/newsletter/campaigns")
    public ResponseEntity<Void> recordCampaign(@RequestBody NewsletterCampaignRequest req) {
        if (req.market() == null || req.sentCount() == null) {
            return ResponseEntity.badRequest().build();
        }
        NewsletterCampaign campaign = new NewsletterCampaign();
        campaign.setMarket(req.market());
        campaign.setSentCount(req.sentCount());
        campaignRepo.save(campaign);
        log.info("[Newsletter] Campaign sent — market={} recipients={}", req.market(), req.sentCount());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/v1/admin/newsletter/campaigns")
    public ResponseEntity<List<NewsletterCampaignDTO>> recentCampaigns(@RequestParam String market) {
        List<NewsletterCampaignDTO> campaigns = campaignRepo.findTop10ByMarketOrderBySentAtDesc(market).stream()
                .map(c -> new NewsletterCampaignDTO(c.getMarket(), c.getSentCount(), c.getSentAt()))
                .toList();
        return ResponseEntity.ok(campaigns);
    }

    /**
     * One-click unsubscribe — no login required, the UUID token is secure enough.
     * Always redirects (even for an unknown token) to avoid info leakage.
     */
    @GetMapping("/api/v1/newsletter/unsubscribe")
    @Transactional
    public ResponseEntity<Void> unsubscribe(@RequestParam UUID token) {
        String redirectBase = frontendUrl;

        var subOpt = repo.findByUnsubscribeToken(token);
        if (subOpt.isPresent()) {
            var sub = subOpt.get();
            sub.setActive(false);
            sub.setUpdatedAt(LocalDateTime.now());
            repo.save(sub);
            log.info("[Newsletter] Unsubscribed {}", sub.getEmail());
            redirectBase = MARKET_FRONTEND_URLS.getOrDefault(sub.getMarket(), frontendUrl);
        } else {
            log.warn("[Newsletter] Unknown unsubscribe token: {}", token);
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectBase + "/newsletter/odjava"))
                .build();
    }
}
