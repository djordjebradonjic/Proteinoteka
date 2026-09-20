package com.proteinoteka.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RateLimitFilterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);

    private RateLimitFilter filter(int perMinute, int burst, String bypass) {
        return new RateLimitFilter(true, perMinute, burst, bypass, 1, now::get);
    }

    private MockHttpServletRequest get(String uri, String forwardedFor) {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", uri);
        req.setRemoteAddr("10.0.0.1");
        if (forwardedFor != null) req.addHeader("X-Forwarded-For", forwardedFor);
        return req;
    }

    private int status(RateLimitFilter f, MockHttpServletRequest req) throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        f.doFilter(req, res, chain);
        return chain.getRequest() == null ? res.getStatus() : 200;
    }

    @Test
    void blocksAfterBurstAndAnswersWithRetryAfter() throws Exception {
        RateLimitFilter f = filter(60, 3, "");
        for (int i = 0; i < 3; i++) assertEquals(200, status(f, get("/api/v1/products", "1.2.3.4")));

        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        f.doFilter(get("/api/v1/products", "1.2.3.4"), res, chain);

        assertEquals(429, res.getStatus());
        assertNull(chain.getRequest());
        assertEquals("1", res.getHeader("Retry-After"));
    }

    @Test
    void refillsOverTime() throws Exception {
        RateLimitFilter f = filter(60, 1, "");
        assertEquals(200, status(f, get("/api/v1/products", "1.2.3.4")));
        assertEquals(429, status(f, get("/api/v1/products", "1.2.3.4")));
        now.addAndGet(1_000); // 60/min = 1 token per second
        assertEquals(200, status(f, get("/api/v1/products", "1.2.3.4")));
    }

    @Test
    void clientsAreCountedSeparately() throws Exception {
        RateLimitFilter f = filter(60, 1, "");
        assertEquals(200, status(f, get("/api/v1/products", "1.1.1.1")));
        assertEquals(429, status(f, get("/api/v1/products", "1.1.1.1")));
        assertEquals(200, status(f, get("/api/v1/products", "2.2.2.2")));
    }

    @Test
    void spoofedLeftHandForwardedForEntriesDoNotHelp() throws Exception {
        RateLimitFilter f = filter(60, 1, "");
        // the proxy appends the real address on the right; the scraper varies only the left part
        assertEquals(200, status(f, get("/api/v1/products", "9.9.9.1, 1.2.3.4")));
        assertEquals(429, status(f, get("/api/v1/products", "9.9.9.2, 1.2.3.4")));
    }

    @Test
    void fallsBackToRemoteAddrWithoutForwardedFor() throws Exception {
        RateLimitFilter f = filter(60, 1, "");
        assertEquals(200, status(f, get("/api/v1/products", null)));
        assertEquals(429, status(f, get("/api/v1/products", null)));
    }

    @Test
    void bypassTokenSkipsTheLimit() throws Exception {
        RateLimitFilter f = filter(60, 1, "s3cret");
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = get("/api/v1/products", "1.2.3.4");
            req.addHeader("X-Internal-Token", "s3cret");
            assertEquals(200, status(f, req));
        }
    }

    @Test
    void wrongOrUnconfiguredBypassTokenDoesNothing() throws Exception {
        RateLimitFilter withToken = filter(60, 1, "s3cret");
        MockHttpServletRequest wrong = get("/api/v1/products", "1.2.3.4");
        wrong.addHeader("X-Internal-Token", "nope");
        assertEquals(200, status(withToken, wrong));
        MockHttpServletRequest wrong2 = get("/api/v1/products", "1.2.3.4");
        wrong2.addHeader("X-Internal-Token", "nope");
        assertEquals(429, status(withToken, wrong2));

        // no token configured: an empty header value must not match an empty token
        RateLimitFilter noToken = filter(60, 1, "");
        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest req = get("/api/v1/products", "5.5.5.5");
            req.addHeader("X-Internal-Token", "");
            if (i == 1) assertEquals(429, status(noToken, req)); else status(noToken, req);
        }
    }

    @Test
    void adminPreflightAndNonApiPathsAreNotLimited() throws Exception {
        RateLimitFilter f = filter(60, 1, "");
        for (int i = 0; i < 4; i++) {
            assertEquals(200, status(f, get("/api/admin/data-quality", "1.2.3.4")));
            assertEquals(200, status(f, get("/api/v1/admin/tracking", "1.2.3.4")));
            assertEquals(200, status(f, get("/api/%61dmin/scrape", "1.2.3.4")));
            assertEquals(200, status(f, get("/swagger-ui.html", "1.2.3.4")));
            MockHttpServletRequest preflight = get("/api/v1/products", "1.2.3.4");
            preflight.setMethod("OPTIONS");
            assertEquals(200, status(f, preflight));
        }
    }

    @Test
    void disabledFilterLetsEverythingThrough() throws Exception {
        RateLimitFilter f = new RateLimitFilter(false, 60, 1, "", 1, now::get);
        for (int i = 0; i < 5; i++) assertEquals(200, status(f, get("/api/v1/products", "1.2.3.4")));
    }
}
