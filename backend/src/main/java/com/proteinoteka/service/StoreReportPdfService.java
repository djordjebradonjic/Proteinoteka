package com.proteinoteka.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.proteinoteka.dto.StoreReportDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Renders a {@link StoreReportDTO} to a PDF byte array. Builds well-formed XHTML directly
 * (openhtmltopdf's core renderer requires strict XML — no lenient HTML5 parsing dependency
 * needed since we control the markup) and lets openhtmltopdf lay it out and paginate it.
 *
 * Uses a bundled DejaVu Sans (src/main/resources/fonts) instead of the PDF base-14 fonts —
 * Helvetica/Arial have no glyphs for č/ć/đ/š/ž, which silently render as "#" otherwise.
 * Loaded from the classpath (not java.io.File) so it works both exploded and inside the
 * packaged Spring Boot jar.
 */
@Service
public class StoreReportPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy.");
    private static final Map<String, String> CURRENCY_BY_MARKET = Map.of("rs", "RSD", "hr", "EUR");
    private static final String FONT_FAMILY = "DejaVu Sans";

    public byte[] render(StoreReportDTO report) {
        String html = buildHtml(report);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFont(() -> getClass().getResourceAsStream("/fonts/DejaVuSans.ttf"), FONT_FAMILY,
                400, com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle.NORMAL, true);
        builder.useFont(() -> getClass().getResourceAsStream("/fonts/DejaVuSans-Bold.ttf"), FONT_FAMILY,
                700, com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle.NORMAL, true);
        builder.withHtmlContent(html, null);
        builder.toStream(out);
        try {
            builder.run();
        } catch (Exception e) {
            throw new RuntimeException("Failed to render store report PDF", e);
        }
        return out.toByteArray();
    }

    private String buildHtml(StoreReportDTO r) {
        String currency = CURRENCY_BY_MARKET.getOrDefault(r.market(), r.market());
        StringBuilder h = new StringBuilder();

        h.append("<html><head><meta charset=\"UTF-8\"/><style>").append(css()).append("</style></head><body>");

        h.append("<h1>Proteinoteka — Mesečni izveštaj</h1>");
        h.append("<p class=\"subtitle\">").append(esc(r.storeName())).append(" · ")
                .append(esc(r.periodStart().format(DATE_FMT))).append(" – ").append(esc(r.periodEnd().format(DATE_FMT)))
                .append(" (").append(r.periodDays()).append(" dana)</p>");

        // ── Engagement ──
        h.append("<h2>1. Saobraćaj sa Proteinoteke</h2>");
        h.append("<table class=\"kpi\"><tr>")
                .append("<td><div class=\"kpi-num\">").append(r.engagement().productViews()).append("</div><div class=\"kpi-label\">pregleda proizvoda</div></td>")
                .append("<td><div class=\"kpi-num\">").append(r.engagement().buyClicks()).append("</div><div class=\"kpi-label\">klikova \"kupi\"</div></td>")
                .append("<td><div class=\"kpi-num\">").append(r.engagement().compareClicks()).append("</div><div class=\"kpi-label\">dodavanja u poređenje</div></td>")
                .append("</tr></table>");

        // ── Price positioning ──
        h.append("<h2>2. Cenovna pozicija u odnosu na konkurenciju</h2>");
        StoreReportDTO.PricePositionSummary ps = r.pricePositionSummary();
        h.append("<p>Od <b>").append(ps.groupedProductCount()).append("</b> proizvoda koje prodaješ a koje prodaje i konkurencija, ")
                .append("najjeftiniji si na <b>").append(ps.cheapestCount()).append("</b>. ")
                .append("Prosečno si <b>").append(fmtPct(ps.avgPctAboveCheapest())).append("%</b> iznad najniže cene na tržištu.</p>");

        if (r.pricePositions().isEmpty()) {
            h.append("<p class=\"muted\">Nema proizvoda sa upoređivom konkurencijom u ovom periodu.</p>");
        } else {
            h.append("<table class=\"data\"><thead><tr><th>Proizvod</th><th>Tvoja cena</th><th>Najniža cena</th><th>Najjeftiniji</th><th>Rang</th><th>% iznad najniže</th></tr></thead><tbody>");
            for (StoreReportDTO.ProductPricePosition p : r.pricePositions()) {
                h.append("<tr><td>").append(esc(p.productName())).append("</td>")
                        .append("<td>").append(fmtPrice(p.yourPrice())).append(" ").append(currency).append("</td>")
                        .append("<td>").append(fmtPrice(p.cheapestPrice())).append(" ").append(currency).append("</td>")
                        .append("<td>").append(esc(p.cheapestStore())).append("</td>")
                        .append("<td>").append(p.yourRank()).append("/").append(p.totalStoresInGroup()).append("</td>")
                        .append("<td class=\"").append(p.pctAboveCheapest() > 0 ? "bad" : "good").append("\">")
                        .append(fmtPct(p.pctAboveCheapest())).append("%</td></tr>");
            }
            h.append("</tbody></table>");
        }

        // ── Lost clicks ──
        h.append("<h2>3. Procena izgubljenih klikova ka konkurenciji</h2>");
        h.append("<p class=\"muted\">Procena na osnovu IP adrese i vremenskog preklapanja (neko je pogledao tvoj proizvod, ")
                .append("pa u naredna 72h kliknuo \"kupi\" kod konkurencije za isti proizvod) — sajt nema login/nalog sistem, ")
                .append("pa ovo NIJE tačno praćenje pojedinačnog korisnika, već procena u pravcu gubitka prodaje.</p>");
        h.append("<p><b>~").append(r.lostClicksEstimate().estimatedCount()).append("</b> procenjenih izgubljenih klikova u ovom periodu.</p>");
        if (!r.lostClicksEstimate().byCompetitor().isEmpty()) {
            h.append("<table class=\"data\"><thead><tr><th>Tvoj proizvod</th><th>Konkurent</th><th>Procenjeni gubitak klikova</th></tr></thead><tbody>");
            for (StoreReportDTO.LostClickDetail d : r.lostClicksEstimate().byCompetitor()) {
                h.append("<tr><td>").append(esc(d.productName())).append("</td><td>").append(esc(d.competitorStore()))
                        .append("</td><td>").append(d.count()).append("</td></tr>");
            }
            h.append("</tbody></table>");
        }

        // ── Search demand ──
        h.append("<h2>4. Šta se najviše traži na Proteinoteci (30 dana, cela kategorija)</h2>");
        h.append(searchTermsTable(r.topSearchTerms()));

        // ── Missed opportunity brands ──
        if (!r.missedOpportunityBrands().isEmpty()) {
            h.append("<h2>5. Traženi brendovi koje trenutno ne prodaješ</h2>");
            h.append("<ul>");
            for (String b : r.missedOpportunityBrands()) h.append("<li>").append(esc(b)).append("</li>");
            h.append("</ul>");
        }

        // ── Price velocity ──
        h.append("<h2>6. Učestalost promene cena</h2>");
        if (r.priceVelocity().isEmpty()) {
            h.append("<p class=\"muted\">Nije bilo promena cena u ovom periodu.</p>");
        } else {
            h.append("<table class=\"data\"><thead><tr><th>Proizvod</th><th>Broj promena cene</th></tr></thead><tbody>");
            for (StoreReportDTO.PriceVelocity v : r.priceVelocity()) {
                h.append("<tr><td>").append(esc(v.productName())).append("</td><td>").append(v.changeCount()).append("</td></tr>");
            }
            h.append("</tbody></table>");
        }

        // ── Reviews & brand reputation ──
        h.append("<h2>7. Ocene i reputacija brendova</h2>");
        StoreReportDTO.RatingSummary rs = r.ratingSummary();
        if (rs.avgRating() != null) {
            h.append("<p>Prosečna ocena tvojih proizvoda: <b>").append(String.format("%.2f", rs.avgRating()))
                    .append("</b> (").append(rs.reviewCount()).append(" recenzija).</p>");
        } else {
            h.append("<p class=\"muted\">Još uvek nema recenzija za tvoje proizvode.</p>");
        }
        if (!r.brandScores().isEmpty()) {
            h.append("<table class=\"data\"><thead><tr><th>Brend</th><th>Skor</th><th>Tier</th></tr></thead><tbody>");
            for (StoreReportDTO.BrandScore b : r.brandScores()) {
                h.append("<tr><td>").append(esc(b.brand())).append("</td><td>").append(String.format("%.1f", b.score()))
                        .append("</td><td>").append(esc(b.tier())).append("</td></tr>");
            }
            h.append("</tbody></table>");
        }

        h.append("<p class=\"footer\">Proteinoteka.rs — izveštaj generisan automatski na osnovu podataka sa sajta.</p>");
        h.append("</body></html>");
        return h.toString();
    }

    private String searchTermsTable(List<StoreReportDTO.SearchTerm> terms) {
        if (terms.isEmpty()) return "<p class=\"muted\">Nema dovoljno podataka o pretragama u ovom periodu.</p>";
        StringBuilder h = new StringBuilder();
        h.append("<table class=\"data\"><thead><tr><th>Pojam</th><th>Broj pretraga</th></tr></thead><tbody>");
        for (StoreReportDTO.SearchTerm t : terms) {
            h.append("<tr><td>").append(esc(t.term())).append("</td><td>").append(t.count()).append("</td></tr>");
        }
        h.append("</tbody></table>");
        return h.toString();
    }

    private static String fmtPrice(double v) {
        return String.format("%,.0f", v);
    }

    private static String fmtPct(double v) {
        return String.format("%.1f", v);
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String css() {
        return """
                @page { size: A4; margin: 2cm; }
                body { font-family: "DejaVu Sans", sans-serif; font-size: 10pt; color: #1a1a1a; }
                h1 { font-size: 20pt; margin-bottom: 2px; color: #0f172a; }
                .subtitle { color: #475569; margin-top: 0; margin-bottom: 20px; }
                h2 { font-size: 13pt; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 22px; }
                table.data { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
                table.data th { text-align: left; background: #f1f5f9; padding: 5px 8px; border-bottom: 1px solid #cbd5e1; }
                table.data td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
                table.kpi { width: 100%; margin-top: 8px; }
                table.kpi td { width: 33%; text-align: center; padding: 10px; background: #f8fafc; }
                .kpi-num { font-size: 18pt; font-weight: bold; color: #0f172a; }
                .kpi-label { font-size: 8pt; color: #64748b; }
                .muted { color: #64748b; font-style: italic; }
                .bad { color: #b91c1c; font-weight: bold; }
                .good { color: #15803d; font-weight: bold; }
                .footer { margin-top: 30px; font-size: 8pt; color: #94a3b8; }
                """;
    }
}
