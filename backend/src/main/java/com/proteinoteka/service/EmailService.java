package com.proteinoteka.service;

import com.proteinoteka.dto.PriceAlertEmailData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    private static final String RESEND_EMAILS_URL = "https://api.resend.com/emails";

    private final RestClient resendClient;
    private final String fromAddress;
    private final String frontendUrl;
    private final String apiUrl;

    public EmailService(
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from:Proteinoteka <alerts@proteinoteka.rs>}") String fromAddress,
            @Value("${app.frontend-url:https://proteinoteka.rs}") String frontendUrl,
            @Value("${app.api-url:http://localhost:8080}") String apiUrl
    ) {
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
        this.apiUrl = apiUrl;
        this.resendClient = RestClient.builder()
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public void sendPriceAlert(PriceAlertEmailData data) {
        String subject = String.format("Cena pala! %s — %s RSD",
                data.productName(), formatPrice(data.newPrice()));

        // Raw destination — used inside the tracked click URL
        String rawProductUrl = frontendUrl + "/product/" + data.productId()
                + "?utm_source=price_alert&utm_medium=email&utm_campaign=price_drop";

        // All clicks in email go through the tracking redirect
        String trackedCta  = buildClickUrl(data.jobId(), rawProductUrl);
        String openPixel   = apiUrl + "/api/v1/alerts/track/open?job=" + data.jobId();
        String unsubscribeLink = apiUrl + "/api/v1/wishlist/unsubscribe?token=" + data.unsubscribeToken();

        Map<String, Object> body = Map.of(
                "from", fromAddress,
                "to", List.of(data.email()),
                "subject", subject,
                "html", buildHtml(data, trackedCta, unsubscribeLink, openPixel)
        );

        resendClient.post()
                .uri(RESEND_EMAILS_URL)
                .body(body)
                .retrieve()
                .toBodilessEntity();

        log.info("[Email] Sent price alert -> {} | product {} | {}% drop",
                data.email(), data.productId(), String.format("%.1f", data.percentageDrop()));
    }

    private String buildClickUrl(Long jobId, String destination) {
        try {
            String encoded = java.net.URLEncoder.encode(destination, java.nio.charset.StandardCharsets.UTF_8);
            return apiUrl + "/api/v1/alerts/track/click?job=" + jobId + "&redirect=" + encoded;
        } catch (Exception e) {
            return destination;
        }
    }

    // ── HTML template ────────────────────────────────────────────────────────────

    private String buildHtml(PriceAlertEmailData data, String productLink, String unsubscribeLink, String openPixel) {
        String savings = formatPrice(data.oldPrice() - data.newPrice());
        String pct = String.format("%.0f", data.percentageDrop());
        String badge30d = data.is30dLow()
                ? "<tr><td align=\"center\" style=\"padding-bottom:20px\">"
                  + "<span style=\"display:inline-block;background:#fff3cd;color:#856404;font-size:13px;"
                  + "font-weight:700;padding:6px 14px;border-radius:99px;border:1px solid #ffc107\">"
                  + "&#128293; Najni&#382;a cena u poslednjih 30 dana</span></td></tr>"
                : "";
        String imageBlock = (data.productImageUrl() != null && !data.productImageUrl().isBlank())
                ? "<tr><td align=\"center\" style=\"padding:24px 0 16px\">"
                  + "<img src=\"" + escapeHtml(data.productImageUrl()) + "\" "
                  + "width=\"160\" height=\"160\" alt=\"\" "
                  + "style=\"object-fit:contain;border-radius:8px\"/></td></tr>"
                : "";

        return "<!DOCTYPE html><html lang=\"sr\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<title>Cena pala!</title></head>"
                + "<body style=\"margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif\">"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f8fafc;padding:32px 0\">"
                + "<tr><td align=\"center\">"
                + "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;"
                + "border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06)\">"

                // Header
                + "<tr><td style=\"background:linear-gradient(135deg,#FF9900,#e68a00);padding:24px;text-align:center\">"
                + "<a href=\"" + frontendUrl + "?utm_source=price_alert&utm_medium=email\" "
                + "style=\"text-decoration:none\">"
                + "<span style=\"color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px\">Proteinoteka</span>"
                + "</a>"
                + "<p style=\"color:rgba(255,255,255,0.85);font-size:13px;margin:4px 0 0\">Uporedjivac cena suplemenata</p>"
                + "</td></tr>"

                // Subheader
                + "<tr><td align=\"center\" style=\"padding:28px 24px 0\">"
                + "<p style=\"font-size:16px;color:#64748b;margin:0 0 4px\">Proizvod koji pratis je pojeftinio!</p>"
                + "<h1 style=\"font-size:26px;font-weight:900;color:#0f172a;margin:0;line-height:1.2\">"
                + escapeHtml(data.productName())
                + "</h1>"
                + "</td></tr>"

                // Product image
                + imageBlock

                // Price drop card
                + "<tr><td style=\"padding:0 24px 24px\">"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0\">"
                + "<tr>"
                + "<td align=\"center\" style=\"padding:24px 16px 8px\">"
                + "<span style=\"font-size:14px;color:#94a3b8;text-decoration:line-through\">"
                + formatPrice(data.oldPrice()) + " RSD</span>"
                + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td align=\"center\" style=\"padding:0 16px 8px\">"
                + "<span style=\"font-size:42px;font-weight:900;color:#0f172a\">"
                + formatPrice(data.newPrice()) + " RSD</span>"
                + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td align=\"center\" style=\"padding:0 16px 20px\">"
                + "<span style=\"display:inline-block;background:#22c55e;color:#fff;font-size:14px;"
                + "font-weight:700;padding:5px 14px;border-radius:99px\">-" + pct + "%</span>"
                + "&nbsp;"
                + "<span style=\"display:inline-block;background:#dbeafe;color:#1e40af;font-size:14px;"
                + "font-weight:600;padding:5px 14px;border-radius:99px\">-" + savings + " RSD</span>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td></tr>"

                // 30d low badge
                + badge30d

                // CTA
                + "<tr><td align=\"center\" style=\"padding:0 24px 32px\">"
                + "<a href=\"" + productLink + "\" "
                + "style=\"display:inline-block;background:linear-gradient(135deg,#FF9900,#e68a00);"
                + "color:#131921;font-size:16px;font-weight:800;text-decoration:none;"
                + "padding:16px 40px;border-radius:12px;"
                + "box-shadow:0 4px 16px rgba(255,153,0,0.40)\">Pogledaj i kupi &rarr;</a>"
                + "</td></tr>"

                // Footer
                + "<tr><td style=\"border-top:1px solid #f1f5f9;padding:20px 24px;text-align:center\">"
                + "<p style=\"font-size:12px;color:#94a3b8;margin:0 0 8px\">"
                + "Primio/la si ovu poruku jer pratis promenu cene ovog proizvoda na Proteinoteka."
                + "</p>"
                + "<a href=\"" + unsubscribeLink + "\" "
                + "style=\"font-size:12px;color:#94a3b8;text-decoration:underline\">"
                + "Odjavi se od obave&#353;tenja za ovaj proizvod</a>"
                + "</td></tr>"

                + "</table>"
                + "</td></tr>"
                + "</table>"
                // Open-tracking pixel — invisible, fires on email open in most clients
                + "<img src=\"" + openPixel + "\" width=\"1\" height=\"1\" alt=\"\" "
                + "style=\"display:none;width:1px;height:1px;opacity:0\" />"
                + "</body></html>";
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private static String formatPrice(double price) {
        return NumberFormat.getNumberInstance(new Locale("sr", "RS"))
                .format(Math.round(price));
    }

    private static String escapeHtml(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
