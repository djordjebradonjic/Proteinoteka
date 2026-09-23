package com.proteinoteka.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

@Component
public class AdminTokenFilter extends OncePerRequestFilter {

    private final String adminToken;

    public AdminTokenFilter(@Value("${admin.token:}") String adminToken) {
        this.adminToken = adminToken;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (isAdminPath(request.getRequestURI())) {
            if (adminToken.isBlank()) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Admin token not configured\"}");
                return;
            }
            String header = request.getHeader("X-Admin-Token");
            if (!tokenMatches(header)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Unauthorized\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean tokenMatches(String header) {
        if (header == null) return false;
        return MessageDigest.isEqual(
                adminToken.getBytes(StandardCharsets.UTF_8),
                header.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * True when the request would be routed to /api/admin/** or /api/v1/admin/**.
     *
     * The raw request URI can't be compared with startsWith: Spring MVC routes on a normalized
     * path (matrix params like ";x=1" stripped, percent-escapes decoded, dot segments resolved),
     * so "/api/admin;x=1/..." or "/api/%61dmin/..." reach an admin controller while the raw
     * string never starts with "/api/admin/". We normalize the same way and fail closed: a path
     * we can't decode is treated as an admin path.
     */
    static boolean isAdminPath(String rawUri) {
        if (rawUri == null) return true;
        List<String> segments;
        try {
            segments = normalizedSegments(rawUri);
        } catch (IllegalArgumentException e) {
            return true;
        }
        if (segments.size() < 2 || !segments.get(0).equals("api")) return false;
        return segments.get(1).equals("admin")
                || (segments.size() >= 3 && segments.get(1).equals("v1") && segments.get(2).equals("admin"));
    }

    /** Path segments as Spring MVC routes them (lower-cased); throws IllegalArgumentException on a bad escape. */
    static List<String> normalizedSegments(String rawUri) {
        // 1. drop ";..." path parameters from every raw segment (what UrlPathHelper does)
        StringBuilder noParams = new StringBuilder();
        for (String segment : rawUri.split("/", -1)) {
            int semi = segment.indexOf(';');
            noParams.append(semi >= 0 ? segment.substring(0, semi) : segment).append('/');
        }
        // 2. percent-decode once; throws IllegalArgumentException on malformed escapes
        String decoded = URLDecoder.decode(noParams.toString().replace("+", "%2B"), StandardCharsets.UTF_8)
                .replace('\\', '/');

        // 3. resolve "." / ".." / empty segments; compare case-insensitively (stricter than MVC)
        List<String> result = new ArrayList<>();
        for (String segment : decoded.split("/", -1)) {
            int semi = segment.indexOf(';');
            String s = (semi >= 0 ? segment.substring(0, semi) : segment).strip().toLowerCase();
            if (s.isEmpty() || s.equals(".")) continue;
            if (s.equals("..")) {
                if (!result.isEmpty()) result.remove(result.size() - 1);
                continue;
            }
            result.add(s);
        }
        return result;
    }
}
