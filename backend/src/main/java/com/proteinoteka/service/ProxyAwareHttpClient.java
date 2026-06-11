package com.proteinoteka.service;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.Authenticator;
import java.net.PasswordAuthentication;

/**
 * Builds Jsoup connections routed through the configured iProyal proxy (if enabled).
 * Used for plain HTML fetches (listing pages, product detail pages) so that
 * server-rendered stores don't need a full Playwright/Chromium load — saving proxy bandwidth.
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
        }
        return conn;
    }
}
