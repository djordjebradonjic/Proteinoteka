package com.proteinoteka.service;

import com.microsoft.playwright.Request;
import com.microsoft.playwright.options.Sizes;
import org.jsoup.Connection;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Running estimate of the bytes one scrape run sends through the IPRoyal proxy (billed per GB).
 * Counted where the run controls the traffic: every finished Playwright request of a proxied
 * browser context (headers + bodies, as sent on the wire) and the JSON/HTML fetches made through
 * {@link ProxyAwareHttpClient}. It is an estimate, good for comparing runs and spotting a regression —
 * not an invoice.
 */
public final class ProxyUsageMeter {

    private final AtomicLong bytes = new AtomicLong();

    public void add(long n) {
        if (n > 0) bytes.addAndGet(n);
    }

    /** Playwright's {@code requestfinished} handler. */
    public void addRequest(Request request) {
        try {
            Sizes s = request.sizes();
            add((long) s.requestBodySize + s.requestHeadersSize + s.responseBodySize + s.responseHeadersSize);
        } catch (RuntimeException ignored) {
            // sizes() can throw for requests that finished without a response (e.g. redirects served from cache)
        }
    }

    /** A JSoup response fetched through the proxy: Content-Length when sent, else the decoded size (an upper bound). */
    public void addResponse(Connection.Response response) {
        String contentLength = response.header("Content-Length");
        if (contentLength != null) {
            try {
                add(Long.parseLong(contentLength.trim()));
                return;
            } catch (NumberFormatException ignored) {
                // fall through to the decoded size
            }
        }
        add(response.bodyAsBytes().length);
    }

    public long total() {
        return bytes.get();
    }
}
