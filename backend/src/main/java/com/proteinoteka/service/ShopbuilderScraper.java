package com.proteinoteka.service;

import com.microsoft.playwright.ElementHandle;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.Product;
import com.proteinoteka.util.ProductNameCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
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
 * Scraper for shopbuilder.rs — Vue.js SPA, Playwright required for listing and detail pages.
 *
 * Listing URL: https://shopbuilder.rs/proteini-c43
 * Loading:     "Učitaj više" load-more button (all products on single URL, no pagination).
 * Detail pages: .composition-block with per-100g nutrition data.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ShopbuilderScraper implements StoreScraper {

    private static final String STORE_NAME  = "Shopbuilder";
    private static final String BASE_URL    = "https://shopbuilder.rs";
    private static final String LISTING_URL = BASE_URL + "/proteini-c43";
    private static final int    MAX_LOAD_MORE_CLICKS      = 60;
    private static final int    MAX_CONSECUTIVE_FAILURES  = 5;
    private static final double MIN_PACKAGE_GRAMS         = 400;

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher    baseEnricher;

    private volatile int productLimit = Integer.MAX_VALUE;

    public void setProductLimit(int limit) { this.productLimit = limit; }
    public void resetProductLimit()        { this.productLimit = Integer.MAX_VALUE; }

    @Override public String  getStoreName()            { return STORE_NAME; }
    @Override public String  getBaseUrl()              { return LISTING_URL; }
    @Override public boolean usePlaywrightForListing() { return true; }

    @Override
    public void waitForListing(Page page) {
        try {
            page.waitForLoadState(LoadState.NETWORKIDLE,
                    new Page.WaitForLoadStateOptions().setTimeout(20000));
        } catch (Exception e) {
            log.warn("[{}] NETWORKIDLE timeout — proceeding anyway", STORE_NAME);
        }

        try {
            page.waitForSelector("div.item-row",
                    new Page.WaitForSelectorOptions().setTimeout(25000));
        } catch (Exception e) {
            String title = "";
            String snippet = "";
            try {
                title = page.title();
                String content = page.content();
                snippet = content.length() > 300 ? content.substring(0, 300) : content;
            } catch (Exception ignored) {}
            log.warn("[{}] Timeout waiting for div.item-row — title='{}' html_start='{}'",
                    STORE_NAME, title, snippet.replaceAll("\\s+", " "));
            return;
        }

        // shopbuilder.rs uses IntersectionObserver on the last item to load more products.
        // scrollIntoViewIfNeeded() is a CDP command that doesn't go through the page's JS event
        // loop, so the observer never fires. Using page.evaluate() to call scrollIntoView() from
        // within the page's own JS context is the only reliable way to trigger the observer.
        int scrolls = 0;
        int consecutiveNoGrowth = 0;
        while (scrolls < MAX_LOAD_MORE_CLICKS) {
            try {
                java.util.List<ElementHandle> rows = page.querySelectorAll("div.item-row");
                int countBefore = rows.size();

                if (!rows.isEmpty()) {
                    ElementHandle lastRow = rows.get(rows.size() - 1);
                    // Run inside the page's JS context so IntersectionObserver fires
                    page.evaluate("el => el.scrollIntoView({block: 'end', behavior: 'smooth'})", lastRow);
                }

                page.waitForTimeout(3000 + ThreadLocalRandom.current().nextInt(2000));

                try {
                    page.waitForLoadState(LoadState.NETWORKIDLE,
                            new Page.WaitForLoadStateOptions().setTimeout(8000));
                } catch (Exception ignored) {}

                int countAfter = page.querySelectorAll("div.item-row").size();

                if (countAfter <= countBefore) {
                    consecutiveNoGrowth++;
                    if (consecutiveNoGrowth >= 3) {
                        log.info("[{}] No new products after {} scrolls — all loaded ({})", STORE_NAME, scrolls + 1, countAfter);
                        break;
                    }
                } else {
                    consecutiveNoGrowth = 0;
                    log.info("[{}] Scroll #{}: {} → {} products", STORE_NAME, scrolls + 1, countBefore, countAfter);
                }

                scrolls++;
            } catch (Exception e) {
                log.warn("[{}] Error during scroll: {}", STORE_NAME, e.getMessage());
                break;
            }
        }

        log.info("[{}] Infinite scroll finished after {} scrolls", STORE_NAME, scrolls);
    }

    // Single-page site — all products load via "Učitaj više" button, no URL-based pagination.
    @Override public String  buildPageUrl(int page)     { return LISTING_URL; }
    @Override public boolean hasNextPage(Document doc)  { return false; }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> stubs = parseListingPage(doc);
        log.info("[{}] Parsed {} products from listing page", STORE_NAME, stubs.size());

        if (page != null && !stubs.isEmpty()) {
            return enrichWithDetails(page, stubs, skipUrls);
        }

        return stubs;
    }

    // ── Listing page parsing ──────────────────────────────────────────────────────

    private List<Product> parseListingPage(Document doc) {
        List<Product> products = new ArrayList<>();
        Elements rows = doc.select("div.item-row");

        for (Element row : rows) {
            try {
                // Product URL — from the image-holder link
                Element imgLink = row.selectFirst("div.item-image-holder a");
                if (imgLink == null) continue;
                String href = imgLink.attr("href").trim();
                if (href.isBlank()) continue;
                String url = href.startsWith("http") ? href : BASE_URL + href;

                // Name — includes weight in trailing <span>
                Element nameEl = row.selectFirst("div.item-name");
                if (nameEl == null) continue;
                String rawName = nameEl.text().trim();
                if (rawName.isBlank()) continue;

                // Brand
                Element brandEl = row.selectFirst("div.brand-name");
                String brand = brandEl != null ? brandEl.text().trim() : null;

                // Price — current price (not old/strikethrough)
                Element priceEl = row.selectFirst("div.price:not(.old)");
                String price = priceEl != null ? parsePrice(priceEl.ownText()) : null;

                // Image — thumbnail, upgrade to full resolution
                Element img = row.selectFirst("div.item-image-holder img");
                String imageUrl = null;
                if (img != null) {
                    String src = img.attr("src").trim();
                    if (!src.isBlank()) {
                        src = src.replace("_200x200.webp", ".webp").replace("_200x200.png", ".png");
                        imageUrl = src.startsWith("http") ? src : BASE_URL + src;
                    }
                }

                // Weight from name "(2,35 kg)", "(500 gr.)", etc.
                double weightGrams = parseWeightFromName(rawName);

                Product p = new Product();
                p.setName(ProductNameCleaner.clean(rawName));
                p.setUrl(url);
                p.setBrand(brand);
                p.setPrice(price);
                p.setImageUrl(imageUrl);
                if (weightGrams >= MIN_PACKAGE_GRAMS) {
                    p.setPrimaryWeightGrams(weightGrams);
                    p.getPackage_weight().add(formatWeight(weightGrams));
                }

                products.add(p);
                log.debug("[{}] Listed: '{}' → {} / {}g", STORE_NAME, p.getName(), p.getPrice(),
                        p.getPrimaryWeightGrams() != null ? Math.round(p.getPrimaryWeightGrams()) : "?");

            } catch (Exception e) {
                log.error("[{}] Error parsing listing row: {}", STORE_NAME, e.getMessage());
            }
        }

        return products;
    }

    // ── Detail page enrichment ────────────────────────────────────────────────────

    private List<Product> enrichWithDetails(Page page, List<Product> stubs, Set<String> skipUrls) {
        List<Product> result = new ArrayList<>();
        int count = 0;
        int consecutiveFailures = 0;

        for (Product stub : stubs) {
            if (count >= productLimit) {
                log.info("[{}] Reached product limit ({}) — stopping detail enrichment", STORE_NAME, productLimit);
                break;
            }
            if (stub.getUrl() == null || stub.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(stub.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, stub.getName());
                continue;
            }

            if (skipUrls.contains(stub.getUrl()) && stub.getPrice() != null) {
                log.info("[{}] Skipping detail for '{}' — nutrition complete in DB", STORE_NAME, stub.getName());
                result.add(stub);
                count++;
                continue;
            }

            try {
                long sleep = 2000 + ThreadLocalRandom.current().nextLong(3000);
                log.info("[{}] Sleeping {}ms before '{}'...", STORE_NAME, sleep, stub.getName());
                Thread.sleep(sleep);

                page.navigate(stub.getUrl(), new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(30000));

                // Wait for Vue.js API calls to finish — composition-block may appear before
                // the flavour select is populated (two separate async renders).
                try {
                    page.waitForLoadState(LoadState.NETWORKIDLE,
                            new Page.WaitForLoadStateOptions().setTimeout(15000));
                } catch (Exception e) {
                    log.warn("[{}] NETWORKIDLE timeout on detail '{}' — proceeding", STORE_NAME, stub.getName());
                }

                try {
                    page.waitForSelector(".add-to-cart-block, .composition-block",
                            new Page.WaitForSelectorOptions().setTimeout(12000));
                } catch (Exception e) {
                    log.warn("[{}] Timeout waiting for detail content for '{}'", STORE_NAME, stub.getName());
                }

                Document detailDoc = Jsoup.parse(page.content());
                enrichFromDetail(detailDoc, stub);

                if (!skipUrls.contains(stub.getUrl())) {
                    if (stub.getProteinPer100g() == null && stub.getDescription() != null) {
                        Double protein = nutritionParser.extractProteinPer100g(stub.getDescription());
                        if (protein != null) stub.setProteinPer100g(protein);
                    }
                    baseEnricher.enrichWithAiIfNeeded(detailDoc, stub, STORE_NAME);
                }

                log.info("[{}] '{}' {}g → price={}, brand={}, protein={}g/100g",
                        STORE_NAME, stub.getName(),
                        stub.getPrimaryWeightGrams() != null ? Math.round(stub.getPrimaryWeightGrams()) : "?",
                        stub.getPrice(), stub.getBrand(), stub.getProteinPer100g());

                result.add(stub);
                count++;
                consecutiveFailures = 0;

                if (count % 15 == 0) {
                    long batchSleep = 12000 + ThreadLocalRandom.current().nextLong(8000);
                    log.info("[{}] Batch pause {}ms after {} products", STORE_NAME, batchSleep, count);
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich '{}': {}", STORE_NAME, stub.getName(), e.getMessage());
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    log.error("[{}] {} consecutive failures — stopping enrichment", STORE_NAME, consecutiveFailures);
                    break;
                }
                safeSleep(3000);
            }
        }

        return result;
    }

    private void enrichFromDetail(Document doc, Product p) {
        if (p.getBrand() == null || p.getBrand().isBlank()) {
            Element brandEl = doc.selectFirst("div.add-to-cart-block a.brand-name");
            if (brandEl != null) p.setBrand(brandEl.text().trim());
        }

        Element priceEl = doc.selectFirst("div.add-to-cart-block div.price:not(.old)");
        if (priceEl != null) {
            String price = parsePrice(priceEl.ownText());
            if (price != null && !price.isBlank()) p.setPrice(price);
        }

        // Full-resolution carousel image
        Element carouselImg = doc.selectFirst("div.carousel-item.active img");
        if (carouselImg != null) {
            String src = carouselImg.attr("src").trim();
            if (!src.isBlank()) p.setImageUrl(src.startsWith("http") ? src : BASE_URL + src);
        }

        // Flavours from select
        Elements options = doc.select("select.custom-select-field option");
        for (Element opt : options) {
            String flavour = opt.text().trim();
            if (!flavour.isBlank() && !p.getFlavours().contains(flavour))
                p.getFlavours().add(flavour);
        }

        // Ingredients text as description
        Element descEl = doc.selectFirst("div.description.bottom-text-block");
        if (descEl != null) {
            String text = descEl.text().trim();
            if (!text.isBlank()) p.setDescription(text);
        }

        extractNutrition(doc, p);
    }

    // ── Nutrition extraction ──────────────────────────────────────────────────────

    /**
     * shopbuilder.rs shows nutrition in .composition-block rows:
     *   span.ingredient-name | span.ingredient-amount (serving) | span.ingredient-dv | span.ingredient-amount (per 100g)
     *
     * The last .ingredient-amount in each row is always the per-100g value.
     */
    public void extractNutrition(Document doc, Product p) {
        Element block = doc.selectFirst("div.composition-block");
        if (block == null) return;

        for (Element row : block.select("div.composition-row")) {
            Element nameEl = row.selectFirst("span.ingredient-name");
            if (nameEl == null) continue;
            String label = nameEl.text().trim().toLowerCase();
            if (label.isBlank()) continue;

            Elements amounts = row.select("span.ingredient-amount");
            if (amounts.isEmpty()) continue;
            String valuePer100g = amounts.last().text().trim();

            switch (label) {
                case "belančevine", "protein", "proteini" -> {
                    Double val = parseGrams(valuePer100g);
                    if (val != null && val >= 15 && val <= 95) p.setProteinPer100g(val);
                }
                case "masti", "ukupne masti", "fat" -> {
                    Double val = parseGrams(valuePer100g);
                    if (val != null && val >= 0 && val <= 100) p.setFatPer100g(val);
                }
                case "šećer", "šećeri", "sugar" -> {
                    Double val = parseGrams(valuePer100g);
                    if (val != null && val >= 0 && val <= 100) p.setSugarPer100g(val);
                }
                case "kalorije", "energija", "energetska vrednost" -> {
                    Double kcal = extractKcal(valuePer100g);
                    if (kcal != null && kcal > 0 && kcal <= 900) p.setCaloriePer100g(kcal);
                }
            }
        }
    }

    // ── Parsing utilities ─────────────────────────────────────────────────────────

    /** "7.038,25 din" or "7038,25 din" → "7038.25" */
    private String parsePrice(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.replaceAll("(?i)din", "").trim();
        if (s.contains(".") && s.contains(",")) {
            s = s.replace(".", "").replace(",", ".");
        } else {
            s = s.replace(",", ".");
        }
        s = s.replaceAll("[^0-9.]", "").trim();
        if (s.isBlank()) return null;
        try {
            double val = Double.parseDouble(s);
            return val > 0 ? s : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Parses weight from "(2,35 kg)", "(500 gr.)" etc. */
    private double parseWeightFromName(String name) {
        if (name == null) return 0;
        Matcher m = Pattern.compile("\\((\\d+[.,]?\\d*)\\s*(kg|gr?\\.?)\\)", Pattern.CASE_INSENSITIVE)
                .matcher(name);
        double best = 0;
        while (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1).replace(",", "."));
                String unit = m.group(2).toLowerCase();
                double grams = unit.startsWith("kg") ? val * 1000 : val;
                if (grams > best) best = grams;
            } catch (Exception ignored) {}
        }
        return best;
    }

    private Double parseGrams(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher m = Pattern.compile("(\\d+[.,]\\d+|\\d+)").matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1).replace(",", ".")); }
            catch (Exception ignored) {}
        }
        return null;
    }

    private Double extractKcal(String text) {
        if (text == null) return null;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal", Pattern.CASE_INSENSITIVE).matcher(text);
        String last = null;
        while (m.find()) last = m.group(1);
        if (last == null) return null;
        try { return Double.parseDouble(last.replace(",", ".")); }
        catch (Exception ignored) { return null; }
    }

    private String formatWeight(double grams) {
        if (grams >= 1000 && grams % 1000 == 0) return (int) (grams / 1000) + "kg";
        if (grams >= 1000) return String.format("%.2f", grams / 1000).replace(".", ",") + "kg";
        return (int) grams + "g";
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
