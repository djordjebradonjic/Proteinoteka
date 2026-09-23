package com.proteinoteka.config;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

class RateLimitFilterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);

    private RateLimitFilter filter(int perMinute, int burst, String bypass) {
        return new RateLimitFilter(true, perMinute, burst, bypass, 1, 48, now::get);
    }

    private MockHttpServletRequest get(String uri, String forwardedFor) {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", uri);
        req.setRemoteAddr("10.0.0.1");
        if (forwardedFor != null) req.addHeader("X-Forwarded-For", forwardedFor);
        return req;
    }

    /** The request the controller would see, or null when the filter answered itself. */
    private jakarta.servlet.ServletRequest passed(RateLimitFilter f, MockHttpServletRequest req) throws Exception {
        MockFilterChain chain = new MockFilterChain();
        f.doFilter(req, new MockHttpServletResponse(), chain);
        return chain.getRequest();
    }

    private MockHttpServletRequest withParams(String uri, String... nameValues) {
        MockHttpServletRequest req = get(uri, "1.2.3.4");
        for (int i = 0; i < nameValues.length; i += 2) req.addParameter(nameValues[i], nameValues[i + 1]);
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
        RateLimitFilter f = new RateLimitFilter(false, 60, 1, "", 1, 48, now::get);
        for (int i = 0; i < 5; i++) assertEquals(200, status(f, get("/api/v1/products", "1.2.3.4")));
    }

    @Test
    void capsSizeAndLimitForClientsWithoutTheToken() throws Exception {
        RateLimitFilter f = filter(600, 60, "s3cret");
        var req = passed(f, withParams("/api/v1/products", "size", "2000", "page", "3", "sort", "id,asc"));
        assertEquals("48", req.getParameter("size"));
        assertEquals("3", req.getParameter("page"));
        assertEquals("id,asc", req.getParameter("sort"));
        assertEquals("48", req.getParameterMap().get("size")[0]);

        assertEquals("48", passed(f, withParams("/api/v1/products/top", "limit", "500")).getParameterValues("limit")[0]);
        // what the site itself asks for is untouched
        assertEquals("12", passed(f, withParams("/api/v1/products", "size", "12")).getParameter("size"));
        assertEquals("abc", passed(f, withParams("/api/v1/products", "size", "abc")).getParameter("size"));
        assertNull(passed(f, withParams("/api/v1/products", "page", "0")).getParameter("size"));
    }

    @Test
    void theNextServerAndB2bKeepLargePages() throws Exception {
        RateLimitFilter f = filter(600, 60, "s3cret");
        MockHttpServletRequest internal = withParams("/api/v1/products", "size", "2000");
        internal.addHeader("X-Internal-Token", "s3cret");
        assertEquals("2000", passed(f, internal).getParameter("size"));
        assertEquals("200", passed(f, withParams("/api/v1/b2b/products", "size", "200")).getParameter("size"));
    }

    @Test
    void noCapWithoutAConfiguredTokenSoServerRenderedPagesAreNotTruncated() throws Exception {
        RateLimitFilter f = filter(600, 60, "");
        assertEquals("2000", passed(f, withParams("/api/v1/products", "size", "2000")).getParameter("size"));
    }

    @RestController
    static class EchoController {
        @GetMapping("/api/v1/products")
        String page(Pageable pageable) { return String.valueOf(pageable.getPageSize()); }

        @GetMapping("/api/v1/products/top")
        String top(@RequestParam(defaultValue = "10") int limit) { return String.valueOf(limit); }
    }

    @Test
    void springBindsTheCappedValues() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new EchoController())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .addFilters(filter(600, 60, "s3cret"))
                .build();
        mvc.perform(MockMvcRequestBuilders.get("/api/v1/products").param("size", "2000")).andExpect(content().string("48"));
        mvc.perform(MockMvcRequestBuilders.get("/api/v1/products/top").param("limit", "500")).andExpect(content().string("48"));
        mvc.perform(MockMvcRequestBuilders.get("/api/v1/products").param("size", "2000").header("X-Internal-Token", "s3cret"))
                .andExpect(content().string("2000"));
    }
}
