package com.proteinoteka.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.LongSupplier;

/**
 * Per-IP token bucket on the public API, so one client cannot page the whole catalogue.
 *
 * <p>Not covered: admin paths (already behind {@link AdminTokenFilter}, and the Vercel admin
 * routes all share a few IPs), CORS preflights, and anything outside {@code /api/v1}. The Next.js
 * server renders pages from a handful of Vercel IPs, so it identifies itself with the
 * {@code X-Internal-Token} header ({@code RATE_LIMIT_BYPASS_TOKEN}); with no token configured
 * there is no bypass at all.
 *
 * <p>The client IP is the entry {@code trustedProxyHops} from the right of {@code X-Forwarded-For}:
 * the left side of that header is client-controlled and would let a scraper dodge the limit by
 * sending a fresh value on every request.
 *
 * <p>Without the token, {@code size} and {@code limit} are also capped at {@code maxPageSize}: the
 * browser never asks for more than a listing page, while an uncapped {@code size=2000} returned
 * the whole catalogue in one request. The Next.js server keeps its large pages (sitemap, SEO
 * lists), so the cap is only applied once a token exists, otherwise it would truncate them. The
 * B2B API has its own keys and limits and is left alone.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    static final String BYPASS_HEADER = "X-Internal-Token";
    private static final Set<String> PAGE_SIZE_PARAMS = Set.of("size", "limit");

    private final boolean enabled;
    private final double refillPerMillis;
    private final double burst;
    private final String bypassToken;
    private final int trustedProxyHops;
    private final int maxPageSize;
    private final LongSupplier clock;
    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(10))
            .maximumSize(200_000)
            .build();

    @Autowired
    public RateLimitFilter(
            @Value("${ratelimit.enabled:true}") boolean enabled,
            @Value("${ratelimit.requests-per-minute:120}") int requestsPerMinute,
            @Value("${ratelimit.burst:60}") int burst,
            @Value("${ratelimit.bypass-token:}") String bypassToken,
            @Value("${ratelimit.trusted-proxy-hops:1}") int trustedProxyHops,
            @Value("${ratelimit.max-page-size:48}") int maxPageSize) {
        this(enabled, requestsPerMinute, burst, bypassToken, trustedProxyHops, maxPageSize, System::currentTimeMillis);
    }

    RateLimitFilter(boolean enabled, int requestsPerMinute, int burst, String bypassToken,
                    int trustedProxyHops, int maxPageSize, LongSupplier clock) {
        this.enabled = enabled;
        this.refillPerMillis = requestsPerMinute / 60_000.0;
        this.burst = Math.max(1, burst);
        this.bypassToken = bypassToken == null ? "" : bypassToken.trim();
        this.trustedProxyHops = Math.max(1, trustedProxyHops);
        this.maxPageSize = Math.max(1, maxPageSize);
        this.clock = clock;
        log.info("API rate limit {}: {} req/min, burst {}, bypass token {}, page size cap {}",
                enabled ? "on" : "off", requestsPerMinute, (int) this.burst,
                this.bypassToken.isEmpty() ? "not set" : "set",
                this.bypassToken.isEmpty() ? "off (needs the token)" : this.maxPageSize);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (!enabled || !isLimited(request) || hasBypassToken(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterMs = tryAcquire(clientIp(request));
        if (retryAfterMs == 0) {
            boolean capPageSize = !bypassToken.isEmpty() && !request.getRequestURI().startsWith("/api/v1/b2b");
            filterChain.doFilter(capPageSize ? new PageSizeCappedRequest(request, maxPageSize) : request, response);
            return;
        }

        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(Math.max(1, (retryAfterMs + 999) / 1000)));
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Too many requests\"}");
    }

    private static boolean isLimited(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return false;
        String uri = request.getRequestURI();
        if (uri == null || !uri.startsWith("/api/v1")) return false;
        return !AdminTokenFilter.isAdminPath(uri);
    }

    private boolean hasBypassToken(HttpServletRequest request) {
        if (bypassToken.isEmpty()) return false;
        String header = request.getHeader(BYPASS_HEADER);
        return header != null && MessageDigest.isEqual(
                bypassToken.getBytes(StandardCharsets.UTF_8),
                header.getBytes(StandardCharsets.UTF_8));
    }

    String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            int index = parts.length - trustedProxyHops;
            if (index >= 0) {
                String ip = parts[index].trim();
                if (!ip.isEmpty()) return ip;
            }
        }
        return request.getRemoteAddr();
    }

    /** @return 0 when the request may proceed, otherwise the milliseconds until a token is free. */
    private long tryAcquire(String ip) {
        return buckets.get(ip, k -> new Bucket(burst, clock.getAsLong())).tryTake(clock.getAsLong(), refillPerMillis, burst);
    }

    /** Lowers {@code size}/{@code limit} to the cap; any other value (non-numeric, smaller) passes as is. */
    static final class PageSizeCappedRequest extends HttpServletRequestWrapper {
        private final Map<String, String[]> params;

        PageSizeCappedRequest(HttpServletRequest request, int max) {
            super(request);
            Map<String, String[]> capped = new LinkedHashMap<>(request.getParameterMap());
            for (String name : PAGE_SIZE_PARAMS) {
                String[] values = capped.get(name);
                if (values != null) capped.put(name, Arrays.stream(values).map(v -> cap(v, max)).toArray(String[]::new));
            }
            this.params = Collections.unmodifiableMap(capped);
        }

        private static String cap(String value, int max) {
            try {
                return Long.parseLong(value.trim()) > max ? String.valueOf(max) : value;
            } catch (NumberFormatException e) {
                return value;
            }
        }

        @Override
        public String getParameter(String name) {
            String[] values = params.get(name);
            return values == null || values.length == 0 ? null : values[0];
        }

        @Override
        public String[] getParameterValues(String name) {
            return params.get(name);
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            return params;
        }

        @Override
        public java.util.Enumeration<String> getParameterNames() {
            return Collections.enumeration(params.keySet());
        }
    }

    private static final class Bucket {
        private double tokens;
        private long lastRefill;

        Bucket(double tokens, long now) {
            this.tokens = tokens;
            this.lastRefill = now;
        }

        synchronized long tryTake(long now, double refillPerMillis, double capacity) {
            tokens = Math.min(capacity, tokens + Math.max(0, now - lastRefill) * refillPerMillis);
            lastRefill = now;
            if (tokens >= 1) {
                tokens -= 1;
                return 0;
            }
            return (long) Math.ceil((1 - tokens) / refillPerMillis);
        }
    }
}
