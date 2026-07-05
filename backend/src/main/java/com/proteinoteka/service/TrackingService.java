package com.proteinoteka.service;

import com.proteinoteka.model.TrackingEvent;
import com.proteinoteka.repository.TrackingEventRepository;
import com.proteinoteka.util.BotDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrackingService {

    private static final int DEDUP_WINDOW_SECONDS = 30;

    private final TrackingEventRepository repository;

    @Async
    public void track(String eventType, Long productId, String store, String query,
                      String ipAddress, String userAgent) {
        if (eventType == null || eventType.isBlank()) return;
        if (BotDetector.isBot(userAgent)) return;

        String normalizedType = eventType.toUpperCase();
        String truncatedQuery = query != null && query.length() > 500 ? query.substring(0, 500) : query;

        try {
            boolean isDuplicate = repository.countRecentByTypeIpAndTarget(
                    normalizedType, ipAddress, productId, truncatedQuery,
                    LocalDateTime.now().minusSeconds(DEDUP_WINDOW_SECONDS)) > 0;
            if (isDuplicate) return;

            TrackingEvent event = new TrackingEvent();
            event.setEventType(normalizedType);
            event.setProductId(productId);
            event.setStore(store);
            event.setQuery(truncatedQuery);
            event.setIpAddress(ipAddress);
            event.setUserAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent);
            repository.save(event);
        } catch (Exception e) {
            log.warn("Failed to save tracking event: {}", e.getMessage());
        }
    }
}
