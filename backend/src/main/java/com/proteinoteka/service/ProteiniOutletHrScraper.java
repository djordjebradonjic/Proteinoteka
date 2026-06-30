package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.ProductNameCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scrapes proteini-outlet.com (WooCommerce, fully SSR, HR market).
 * Category: /shop/proteini/ — 74+ products across 5 pages (16 per page).
 *
 * Proxy credit strategy:
 *   - Listing pages: plain JSoup (usePlaywrightForListing=false, no proxy needed).
 *     WooCommerce renders all product data server-side — no JS execution required.
 *   - Detail pages: JSoup only when nutrition or brand is missing. Products already
 *     in DB with complete nutrition are added from skipUrls without any HTTP request.
 *
 * Nutrition situation: the "Sastav" tab on this site contains a nutrition IMAGE,
 * not an HTML table. All nutrition fields are therefore filled by AI enrichment
 * (BaseScraperEnricher.enrichWithAiIfNeeded) using the product description text as context.
 *
 * Listing provides directly (no detail page needed):
 *   name, url, price (EUR), package weight, image, flavours
 *
 * Detail page provides:
 *   brand (from woocommerce-product-attributes "Brandovi" row), description
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProteiniOutletHrScraper implements StoreScraper {

    private static final String STORE_NAME  = "Proteini Outlet";
    private static final String SITE_ORIGIN = "https://www.proteini-outlet.com";
    private static final String BASE_URL    = SITE_ORIGIN + "/shop/proteini/";

    private static final int MAX_DETAIL_FETCH_RETRIES = 3;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    // Matches "40,00 €" or "40.00 €" — returns first decimal number found
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)");
    // Matches "300g", "2kg", "6,8kg", "2.27kg"
    private static final Pattern WEIGHT_PATTERN =
            Pattern.compile("(\\d+[.,]?\\d*)\\s*kg|([1-9]\\d{2,4})\\s*g", Pattern.CASE_INSENSITIVE);

    private final BaseScraperEnricher baseEnricher;
    private final ProxyAwareHttpClient httpClient;

    @Override public String getStoreName()                  { return STORE_NAME; }
    @Override public String getBaseUrl()                    { return BASE_URL; }
    @Override public String getMarket()                     { return "hr"; }
    @Override public String getCurrency()                   { return "EUR"; }
    @Override public boolean usePlaywrightForListing()      { return false; }
    @Override public boolean skipDetailIfDescriptionExists(){ return true; }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "page/" + (page + 1) + "/";
    }

    /**
     * Returns true if there is at least one more page after the current one.
     * This site renders numbered pagination only (no "next" button), so we check
     * whether the current-page span has a sibling li with an anchor link.
     */
    @Override
    public boolean hasNextPage(Document doc) {
        // Standard WooCommerce "next" button (some themes)
        if (doc.selectFirst("a.next.page-numbers") != null) return true;
        // Numbered-only pagination: current page is a <span> inside <li>
        Element current = doc.selectFirst("nav.woocommerce-pagination span.page-numbers.current");
        if (current == null) return false;
        Element li = current.parent(); // <li>
        if (li == null) return false;
        Element nextLi = li.nextElementSibling();
        return nextLi != null && nextLi.selectFirst("a.page-numbers") != null;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = new ArrayList<>();

        Elements cards = doc.select("ul.products li.product");
        log.info("[{}] Found {} product cards on listing page", STORE_NAME, cards.size());

        for (Element card : cards) {
            Product p = parseCard(card);
            if (p != null) stubs.add(p);
        }

        log.info("[{}] {} stubs parsed, {} already have complete nutrition (no detail fetch)",
                STORE_NAME, stubs.size(),
                stubs.stream().filter(s -> skipUrls.contains(s.getUrl())).count());

        return enrichWithDetails(stubs, skipUrls);
    }

    // ── Listing page parsing ───────────────────────────────────────────────────

    private Product parseCard(Element card) {
        try {
            // Skip gainers — they appear under /shop/proteini/ in a sub-category
            if (isGainerCard(card)) return null;

            Element anchor = card.selectFirst("a.woocommerce-LoopProduct-link");
            if (anchor == null) return null;
            String url = anchor.attr("href").trim();
            if (url.isBlank()) return null;

            Element nameEl = card.selectFirst("h2.woocommerce-loop-product__title");
            if (nameEl == null) return null;
            String name = nameEl.text().trim();
            if (name.isBlank()) return null;

            // Price from "40,00 €" inside span.price bdi
            Double price = extractListingPrice(card);

            // Package weight from dedicated <div class="pakiranje"><b>300g</b></div>
            Double weightGrams = extractWeightFromPakiranjeDiv(card);
            if (weightGrams == null) weightGrams = extractWeightFromText(name);

            // Best image: srcset first (highest resolution), fallback src
            String imageUrl = extractImage(card);

            // Flavours from ivpa-register variation spans
            List<String> flavours = extractFlavours(card);

            Product p = new Product();
            p.setName(ProductNameCleaner.clean(name));
            p.setUrl(url);
            if (price != null) p.setPrice(String.valueOf(price));
            if (weightGrams != null && weightGrams > 0) p.setPrimaryWeightGrams(weightGrams);
            if (imageUrl != null && !imageUrl.isBlank()) p.setImageUrl(imageUrl);
            if (!flavours.isEmpty()) p.setFlavours(flavours);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing card: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    /** Products in the gainer sub-category are present on this listing page — skip them. */
    private boolean isGainerCard(Element card) {
        String classes = card.className();
        return classes.contains("product_cat-proteini-za-masu-gainer")
                || classes.contains("product_cat-gainer");
    }

    private Double extractListingPrice(Element card) {
        // On-sale: current price in <ins>
        Element ins = card.selectFirst("span.price ins .woocommerce-Price-amount bdi,"
                + " span.price ins .amount bdi");
        if (ins != null) return parsePrice(ins.text());

        // Regular price
        Element bdi = card.selectFirst("span.price .woocommerce-Price-amount bdi,"
                + " span.price .amount bdi");
        if (bdi != null) return parsePrice(bdi.text());

        Element span = card.selectFirst("span.price");
        if (span != null) return parsePrice(span.text());
        return null;
    }

    /** Parses the dedicated WP/theme element: {@code <div class="pakiranje">Pakiranje: <b>300g</b></div>} */
    private Double extractWeightFromPakiranjeDiv(Element card) {
        Element b = card.selectFirst("div.pakiranje b");
        if (b == null) return null;
        return parseWeightString(b.text().trim());
    }

    /** Picks the highest-resolution URL from a srcset string. Falls back to src. */
    private String extractImage(Element card) {
        Element img = card.selectFirst(
                "a.woocommerce-LoopProduct-link img.attachment-woocommerce_thumbnail,"
                        + " a.woocommerce-LoopProduct-link .cz_main_image img");
        if (img == null) img = card.selectFirst("img.attachment-woocommerce_thumbnail");
        if (img == null) return null;

        String srcset = img.attr("srcset");
        if (!srcset.isBlank()) {
            // srcset entries are comma-separated: "url w, url w"
            String[] entries = srcset.split(",");
            // Last entry is highest resolution for this theme
            String last = entries[entries.length - 1].trim();
            String candidate = last.split("\\s+")[0];
            if (!candidate.isBlank()) {
                return candidate.startsWith("http") ? candidate : SITE_ORIGIN + candidate;
            }
        }

        String src = img.attr("src");
        if (!src.isBlank()) return src.startsWith("http") ? src : SITE_ORIGIN + src;
        return null;
    }

    /**
     * Extracts available flavours from the IVPA (Improved Variable Product Attributes) plugin spans.
     * Each in-stock variation is rendered as: {@code <span class="ivpa_term ivpa_active" data-term="visnja">Višnja</span>}
     */
    private List<String> extractFlavours(Element card) {
        List<String> flavours = new ArrayList<>();
        Elements terms = card.select("div.ivpa-register span.ivpa_term");
        for (Element term : terms) {
            String text = term.text().trim();
            if (!text.isBlank()) flavours.add(text);
        }
        return flavours;
    }

    // ── Detail page enrichment ─────────────────────────────────────────────────

    private List<Product> enrichWithDetails(List<Product> stubs, Set<String> skipUrls) {
        List<Product> result = new ArrayList<>();
        int consecutiveFailures = 0;

        for (Product stub : stubs) {
            if (stub.getUrl() == null || stub.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(stub.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, stub.getName());
                continue;
            }

            if (skipUrls.contains(stub.getUrl())) {
                log.debug("[{}] '{}' — nutrition complete, skipping detail fetch",
                        STORE_NAME, stub.getName());
                result.add(stub);
                continue;
            }

            Document doc = fetchDetailPage(stub.getUrl());
            if (doc == null) {
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    log.error("[{}] {} consecutive failures — stopping enrichment",
                            STORE_NAME, consecutiveFailures);
                    return result;
                }
                continue;
            }
            consecutiveFailures = 0;

            try {
                enrichProduct(doc, stub);
                result.add(stub);
                log.info("[{}] Enriched '{}' brand='{}' protein={}g/100g",
                        STORE_NAME, stub.getName(), stub.getBrand(), stub.getProteinPer100g());
            } catch (Exception e) {
                log.error("[{}] Error enriching '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
            }

            safeSleep(2000 + ThreadLocalRandom.current().nextLong(2000));
        }

        return result;
    }

    private void enrichProduct(Document doc, Product p) {
        // Brand from WooCommerce attributes table ("Brandovi" row)
        if (p.getBrand() == null || p.getBrand().isBlank()) {
            String brand = extractBrandFromAttributes(doc);
            if (brand != null) p.setBrand(brand);
        }

        // Weight from attributes table ("Pakiranje" row) if not set from listing
        if (p.getPrimaryWeightGrams() == null || p.getPrimaryWeightGrams() == 0) {
            Double weight = extractWeightFromAttributes(doc);
            if (weight == null) weight = extractWeightFromText(p.getName());
            if (weight != null && weight > 0) p.setPrimaryWeightGrams(weight);
        }

        // Description from the description tab
        Element descPanel = doc.selectFirst(
                "div#tab-description.woocommerce-Tabs-panel,"
                        + " div.woocommerce-Tabs-panel--description");
        if (descPanel != null) {
            String desc = descPanel.text().trim();
            if (!desc.isBlank() && (p.getDescription() == null || p.getDescription().isBlank())) {
                p.setDescription(desc.length() > 3000 ? desc.substring(0, 3000) : desc);
            }
        }

        // Nutrition on this site is in an image — no table to parse.
        // Pass description + ingredient text to AI so it can extract values.
        // Also include the "Sastav" tab text which contains ingredient list.
        if (p.getDescription() == null || p.getDescription().isBlank()) {
            Element sastavPanel = doc.selectFirst("div#tab-sastav.woocommerce-Tabs-panel,"
                    + " div.woocommerce-Tabs-panel--sastav");
            if (sastavPanel != null) {
                String sastavText = sastavPanel.text().trim();
                if (!sastavText.isBlank()) p.setDescription(sastavText);
            }
        } else {
            // Append ingredient text from Sastav tab to help AI
            Element sastavPanel = doc.selectFirst("div#tab-sastav.woocommerce-Tabs-panel,"
                    + " div.woocommerce-Tabs-panel--sastav");
            if (sastavPanel != null) {
                String sastavText = sastavPanel.text().trim();
                if (!sastavText.isBlank()) {
                    String combined = p.getDescription() + " " + sastavText;
                    p.setDescription(combined.length() > 3000
                            ? combined.substring(0, 3000) : combined);
                }
            }
        }

        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);
    }

    /**
     * Parses the WooCommerce product attributes table looking for the "Brandovi" row.
     * Table structure:
     * {@code <table class="woocommerce-product-attributes">
     *   <tr class="...attribute_pa_brandovi">
     *     <th>Brandovi</th>
     *     <td><p>All Stars</p></td>
     *   </tr>
     * </table>}
     */
    private String extractBrandFromAttributes(Document doc) {
        for (Element row : doc.select("table.woocommerce-product-attributes tr")) {
            Element th = row.selectFirst("th");
            if (th == null) continue;
            String label = th.text().trim().toLowerCase();
            if (label.equals("brandovi") || label.equals("brand") || label.equals("proizvođač")) {
                Element td = row.selectFirst("td");
                if (td != null) {
                    String brand = td.text().trim();
                    if (!brand.isBlank()) return brand;
                }
            }
        }
        // Fallback: <strong>Proizvođač:</strong> <b>All Stars</b> in summary
        Element meta = doc.selectFirst(".product_meta");
        if (meta != null) {
            for (Element strong : meta.select("strong")) {
                if (strong.text().toLowerCase().contains("proizvođač")) {
                    Element next = strong.nextElementSibling();
                    if (next != null && !next.text().isBlank()) return next.text().trim();
                    String txt = strong.parent() != null ? strong.parent().text() : "";
                    int idx = txt.indexOf(strong.text()) + strong.text().length();
                    if (idx < txt.length()) {
                        return txt.substring(idx).replaceFirst("^[:\\s]+", "").trim();
                    }
                }
            }
        }
        return null;
    }

    private Double extractWeightFromAttributes(Document doc) {
        for (Element row : doc.select("table.woocommerce-product-attributes tr")) {
            Element th = row.selectFirst("th");
            if (th == null) continue;
            String label = th.text().trim().toLowerCase();
            if (label.equals("pakiranje") || label.equals("težina") || label.equals("veličina")) {
                Element td = row.selectFirst("td");
                if (td != null) return parseWeightString(td.text().trim());
            }
        }
        return null;
    }

    // ── Parsers ────────────────────────────────────────────────────────────────

    /** Parses "40,00 €", "40.00", "40" → 40.0 */
    private Double parsePrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // Remove currency symbols and non-numeric characters except comma/dot
        String cleaned = raw.replaceAll("[^\\d,.]", "").trim();
        // Handle thousands separator: "1.234,56" or "1,234.56"
        if (cleaned.matches(".*[,.].*[,.].*")) {
            // More than one separator — strip all but last decimal
            char lastSep = cleaned.charAt(cleaned.length() - 3);
            if (lastSep == ',' || lastSep == '.') {
                cleaned = cleaned.substring(0, cleaned.length() - 3)
                        .replaceAll("[,.]", "") + "." + cleaned.substring(cleaned.length() - 2);
            } else {
                cleaned = cleaned.replaceAll("[,.]", "");
            }
        }
        cleaned = cleaned.replace(",", ".");
        try { return Double.parseDouble(cleaned); }
        catch (NumberFormatException e) {
            Matcher m = PRICE_PATTERN.matcher(raw);
            if (m.find()) {
                try { return Double.parseDouble(m.group(1).replace(",", ".")); }
                catch (NumberFormatException ignored) {}
            }
            return null;
        }
    }

    /**
     * Parses weight strings like "300g", "2kg", "6,8kg", "2.27kg".
     * Returns value in grams.
     */
    private Double parseWeightString(String raw) {
        if (raw == null || raw.isBlank()) return null;
        Matcher m = WEIGHT_PATTERN.matcher(raw);
        if (!m.find()) return null;
        try {
            if (m.group(1) != null) {
                double kg = Double.parseDouble(m.group(1).replace(",", "."));
                return kg * 1000;
            }
            if (m.group(2) != null) {
                double g = Double.parseDouble(m.group(2));
                if (g >= 50) return g;
            }
        } catch (NumberFormatException ignored) {}
        return null;
    }

    private Double extractWeightFromText(String text) {
        if (text == null) return null;
        Matcher m = WEIGHT_PATTERN.matcher(text);
        while (m.find()) {
            try {
                if (m.group(1) != null)
                    return Double.parseDouble(m.group(1).replace(",", ".")) * 1000;
                if (m.group(2) != null) {
                    double g = Double.parseDouble(m.group(2));
                    if (g >= 100) return g;
                }
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    // ── HTTP ───────────────────────────────────────────────────────────────────

    private Document fetchDetailPage(String url) {
        for (int attempt = 1; attempt <= MAX_DETAIL_FETCH_RETRIES; attempt++) {
            try {
                return httpClient.connection(url)
                        .header("Accept-Language", "hr-HR,hr;q=0.9,en;q=0.8")
                        .get();
            } catch (Exception e) {
                log.warn("[{}] Detail fetch attempt {}/{} failed for {}: {}",
                        STORE_NAME, attempt, MAX_DETAIL_FETCH_RETRIES, url, e.getMessage());
                safeSleep(3000L * attempt);
            }
        }
        return null;
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
