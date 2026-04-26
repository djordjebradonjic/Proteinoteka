package com.proteinoteka.service;

import com.proteinoteka.model.TrackingEvent;
import com.proteinoteka.repository.TrackingEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrackingService {

    private final TrackingEventRepository repository;

    @Async
    public void track(String eventType, Long productId, String store, String query,
                      String ipAddress, String userAgent) {
        if (eventType == null || eventType.isBlank()) return;
        try {
            TrackingEvent event = new TrackingEvent();
            event.setEventType(eventType.toUpperCase());
            event.setProductId(productId);
            event.setStore(store);
            event.setQuery(query != null && query.length() > 500 ? query.substring(0, 500) : query);
            event.setIpAddress(ipAddress);
            event.setUserAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent);
            repository.save(event);
        } catch (Exception e) {
            log.warn("Failed to save tracking event: {}", e.getMessage());
        }
    }
}
