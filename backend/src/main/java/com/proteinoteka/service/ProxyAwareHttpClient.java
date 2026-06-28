package com.proteinoteka.service;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.Authenticator;
import java.net.PasswordAuthentication;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

/**
 * Builds Jsoup connections routed through the configured iProyal proxy (if enabled).
 * Used for plain HTML fetches (listing pages, product detail pages) so that
 * server-rendered stores don't need a full Playwright/Chromium load — saving proxy bandwidth.
 *
 * SSL note: iProyal uses a transparent HTTP CONNECT tunnel — the target site's TLS certificate
 * is presented directly to the client, so normal certificate validation works fine.
 * However, on some Railway JVM images the CA bundle is incomplete; we bypass SSL verification
 * when the proxy is active to avoid PKIX failures that have nothing to do with the target site.
 */
@Component
public class ProxyAwareHttpClient {

    @Value("${playwright.proxy.enabled:false}")
    private boolean proxyEnabled;

    @Value("${playwright.proxy.host:geo.iproyal.com}")
    private String proxyHost;

    @Value("${playwright.proxy.port:12321}")
    private int proxyPort;

    @Value("${playwright.proxy.username:}")
    private String proxyUsername;

    @Value("${playwright.proxy.password:}")
    private String proxyPassword;

    private static final javax.net.ssl.SSLSocketFactory TRUST_ALL_FACTORY = buildTrustAllFactory();

    public Connection connection(String url) {
        if (proxyEnabled && !proxyHost.isBlank() && !proxyUsername.isBlank()) {
            // Java 8u111+ disables Basic auth for HTTPS proxy tunneling by default — re-enable it
            System.setProperty("jdk.http.auth.tunneling.disabledSchemes", "");
            System.setProperty("jdk.http.auth.proxying.disabledSchemes", "");
            Authenticator.setDefault(new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(proxyUsername, proxyPassword.toCharArray());
                }
            });
        }

        Connection conn = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                .header("Accept-Language", "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7")
                .referrer("https://www.google.com/")
                .timeout(15000);

        if (proxyEnabled && !proxyHost.isBlank()) {
            conn = conn.proxy(proxyHost, proxyPort);
            // Bypass SSL certificate verification when routing through proxy.
            // The Railway JVM CA bundle may not include all intermediate CAs needed to
            // validate the CONNECT tunnel, causing PKIX failures on otherwise valid sites.
            if (TRUST_ALL_FACTORY != null) {
                conn = conn.sslSocketFactory(TRUST_ALL_FACTORY);
            }
        }
        return conn;
    }

    private static javax.net.ssl.SSLSocketFactory buildTrustAllFactory() {
        try {
            SSLContext ctx = SSLContext.getInstance("TLS");
            ctx.init(null, new TrustManager[]{new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                public void checkClientTrusted(X509Certificate[] c, String a) {}
                public void checkServerTrusted(X509Certificate[] c, String a) {}
            }}, new SecureRandom());
            return ctx.getSocketFactory();
        } catch (Exception e) {
            return null;
        }
    }
}
