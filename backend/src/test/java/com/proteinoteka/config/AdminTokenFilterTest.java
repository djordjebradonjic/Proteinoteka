package com.proteinoteka.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminTokenFilterTest {

    // ── path classification ──────────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/admin/data-quality/report",
            "/api/admin",
            "/api/v1/admin/tracking",
            // matrix parameters — stripped by Spring MVC, so they still reach the controller
            "/api/admin;x=1/data-quality/report",
            "/api/v1/admin;a/tracking",
            "/api/v1;a/admin/tracking",
            "/api;a/admin/scrape",
            // percent-encoding — decoded by Spring MVC
            "/api/%61dmin/data-quality/report",
            "/api/v1/%61dmin/tracking",
            "/%61pi/admin/scrape",
            "/api/%41DMIN/scrape",
            // dot segments, duplicate and back slashes, upper case
            "/api/x/../admin/scrape",
            "/api/x/%2e%2e/admin/scrape",
            "/api//admin/scrape",
            "/API/ADMIN/scrape",
            "/api\\admin/scrape",
            // malformed escape: cannot be decoded, so fail closed
            "/api/admin/%zz",
            "/api/%ZZ/whatever"
    })
    void adminPathsAreDetected(String uri) {
        assertTrue(AdminTokenFilter.isAdminPath(uri), uri);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/",
            "/api/v1/products",
            "/api/v1/products/42/buy",
            "/api/v1/wishlist/unsubscribe",
            "/api/v1/newsletter/subscribe",
            "/api/v1/b2b/products",
            "/api/track",
            "/api/administrator-guide",
            "/api/v1/administrators"
    })
    void publicPathsAreNotTreatedAsAdmin(String uri) {
        assertFalse(AdminTokenFilter.isAdminPath(uri), uri);
    }

    // ── end-to-end filter behaviour ──────────────────────────────────────────────

    private static MockHttpServletResponse run(AdminTokenFilter filter, String uri, String token, MockFilterChain chain)
            throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        request.setRequestURI(uri);
        if (token != null) request.addHeader("X-Admin-Token", token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    @Test
    void bypassAttemptsAreRejectedWithoutToken() throws Exception {
        AdminTokenFilter filter = new AdminTokenFilter("s3cret");
        for (String uri : new String[]{
                "/api/admin/scrape", "/api/admin;x=1/scrape", "/api/%61dmin/scrape", "/api/v1/admin;a/tracking"}) {
            MockFilterChain chain = new MockFilterChain();
            MockHttpServletResponse response = run(filter, uri, null, chain);
            assertEquals(401, response.getStatus(), uri);
            assertNull(chain.getRequest(), "chain must not run for " + uri);
        }
    }

    @Test
    void wrongTokenIsRejected() throws Exception {
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = run(new AdminTokenFilter("s3cret"), "/api/admin;x=1/scrape", "nope", chain);
        assertEquals(401, response.getStatus());
        assertNull(chain.getRequest());
    }

    @Test
    void correctTokenPassesEvenWithObfuscatedPath() throws Exception {
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = run(new AdminTokenFilter("s3cret"), "/api/admin;x=1/scrape", "s3cret", chain);
        assertEquals(200, response.getStatus());
        assertNotNull(chain.getRequest());
    }

    @Test
    void blankConfiguredTokenFailsClosed() throws Exception {
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = run(new AdminTokenFilter(""), "/api/%61dmin/scrape", "", chain);
        assertEquals(401, response.getStatus());
        assertNull(chain.getRequest());
    }

    @Test
    void publicPathsAreNeverBlocked() throws Exception {
        MockFilterChain chain = new MockFilterChain();
        MockHttpServletResponse response = run(new AdminTokenFilter("s3cret"), "/api/v1/products", null, chain);
        assertEquals(200, response.getStatus());
        assertNotNull(chain.getRequest());
    }
}
