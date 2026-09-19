package com.proteinoteka.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RedirectAllowlistTest {

    private static final String FRONTEND = "https://proteinoteka.rs";

    @ParameterizedTest
    @ValueSource(strings = {
            "https://proteinoteka.rs/product/12?utm_source=price_alert&utm_medium=email",
            "https://www.proteinoteka.rs/",
            "https://proteinoteka.com.hr/product/7",
            "HTTPS://Proteinoteka.RS/x",
            "https://proteinoteka.rs"
    })
    void ownStorefrontUrlsAreAllowed(String url) {
        assertTrue(RedirectAllowlist.isAllowed(url, FRONTEND), url);
        assertEquals(url, RedirectAllowlist.safeOrFallback(url, FRONTEND, "fallback"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://evil.com/",
            "https://proteinoteka.rs.evil.com/",
            "https://evilproteinoteka.rs/",
            "https://proteinoteka.rs@evil.com/",
            "https://evil.com\\@proteinoteka.rs/",
            "//evil.com/",
            "/relative/path",
            "javascript:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "ftp://proteinoteka.rs/",
            "https:///no-host",
            "not a url at all",
            "",
            "   "
    })
    void everythingElseFallsBack(String url) {
        assertFalse(RedirectAllowlist.isAllowed(url, FRONTEND), url);
        assertEquals("fallback", RedirectAllowlist.safeOrFallback(url, FRONTEND, "fallback"));
    }

    @Test
    void nullFallsBack() {
        assertEquals("fallback", RedirectAllowlist.safeOrFallback(null, FRONTEND, "fallback"));
    }

    @Test
    void configuredFrontendHostIsAllowedForDevSetups() {
        assertTrue(RedirectAllowlist.isAllowed("http://localhost:3000/product/1", "http://localhost:3000"));
        assertFalse(RedirectAllowlist.isAllowed("http://localhost:3000/product/1", FRONTEND));
    }

    @Test
    void brokenFrontendUrlConfigDoesNotOpenAnything() {
        assertFalse(RedirectAllowlist.isAllowed("https://evil.com/", "not a url"));
        assertFalse(RedirectAllowlist.isAllowed("https://evil.com/", null));
    }
}
