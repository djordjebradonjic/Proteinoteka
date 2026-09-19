package com.proteinoteka.util;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/**
 * Guards redirects whose target comes from a request parameter, so a link on our domain
 * can't be turned into an open redirect (phishing via a trusted URL).
 */
public final class RedirectAllowlist {

    // Same storefront domains as frontend/lib/marketConfig.ts (plus www variants).
    private static final Set<String> STOREFRONT_HOSTS = Set.of(
            "proteinoteka.rs", "www.proteinoteka.rs",
            "proteinoteka.com.hr", "www.proteinoteka.com.hr"
    );

    private RedirectAllowlist() {}

    /**
     * Returns {@code target} when it is an absolute http(s) URL on one of our storefront hosts
     * (or on the host of the configured frontend URL, e.g. localhost in dev); otherwise returns
     * {@code fallback}. Never throws on malformed input.
     */
    public static String safeOrFallback(String target, String frontendUrl, String fallback) {
        return isAllowed(target, frontendUrl) ? target : fallback;
    }

    static boolean isAllowed(String target, String frontendUrl) {
        if (target == null || target.isBlank()) return false;
        try {
            URI uri = URI.create(target.strip());
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))) return false;
            if (uri.getRawUserInfo() != null) return false;
            String host = uri.getHost();
            if (host == null) return false;
            host = host.toLowerCase(Locale.ROOT);
            if (STOREFRONT_HOSTS.contains(host)) return true;
            return host.equals(hostOf(frontendUrl));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String hostOf(String url) {
        try {
            String host = url == null ? null : URI.create(url.strip()).getHost();
            return host == null ? null : host.toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
