package com.proteinoteka.service;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitUntilState;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.util.PriceParser;
import com.proteinoteka.util.WeightParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scraper for xsport.rs — static PHP site, no JS needed for listing.
 *
 * Listing: https://www.xsport.rs/grupa/proteini?page=N (pages 1..N)
 * Detail:  https://www.xsport.rs/proizvod/<slug>
 *
 * Price format on listing: "8.950,00 RSD" or "8.950,00 - 9.590,00 RSD" (min taken).
 * Products with multiple flavors show a price range — we take the minimum (cheapest variant).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class XSportScraper implements StoreScraper {

    private static final String STORE_NAME  = "XSport";
    private static final String BASE_URL    = "https://www.xsport.rs";
    private static final String LISTING_URL = BASE_URL + "/grupa/proteini";

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher    baseEnricher;
    private final ProductRepository      productRepository;
    private final PriceParser            priceParser;
    private final WeightParser           weightParser;

    @Override public String  getStoreName()            { return STORE_NAME; }
    @Override public String  getBaseUrl()              { return LISTING_URL; }
    @Override public boolean usePlaywrightForListing() { return false; }

    @Override
    public String buildPageUrl(int page) {
        return LISTING_URL + "?page=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        Element activeEl = doc.selectFirst("ul.pagination-v2 li.active a");
        if (activeEl == null) return false;
        int activePage;
        try {
            activePage = Integer.parseInt(activeEl.text().trim());
        } catch (NumberFormatException e) {
            return false;
        }
        int maxPage = 0;
        for (Element a : doc.select("ul.pagination-v2 li a")) {
            try {
                int num = Integer.parseInt(a.text().trim());
                if (num > maxPage) maxPage = num;
            } catch (NumberFormatException ignored) {}
        }
        return activePage < maxPage;
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        return scrape(page, doc, Collections.emptySet());
    }

    @Override
    public List<Product> scrape(Page page, Document doc, Set<String> skipUrls) {
        List<Product> products = new ArrayList<>();

        Elements items = doc.select("div.product-list-item");
        log.info("[{}] Found {} product items on listing page", STORE_NAME, items.size());

        for (Element item : items) {
            Product p = parseListingItem(item);
            if (p != null) products.add(p);
        }

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products, skipUrls);
        }

        return products;
    }

    // ── Listing parsing ──────────────────────────────────────────────────────────

    private Product parseListingItem(Element item) {
        try {
            Element titleEl = item.selectFirst("a.product-list-title");
            if (titleEl == null) return null;

            String name = titleEl.text().trim();
            String url  = titleEl.attr("href");
            if (url.isBlank()) return null;
            if (!url.startsWith("http")) url = BASE_URL + url;

            String imageUrl = null;
            Element img = item.selectFirst("div.col-md-3 img.img-responsive, div.col-sm-12 img.img-responsive");
            if (img != null) {
                imageUrl = img.attr("src");
                if (!imageUrl.startsWith("http")) imageUrl = BASE_URL + imageUrl;
            }

            String price = parseListingPrice(item);

            String description = null;
            Element descEl = item.selectFirst("div.col-md-9 p, div.col-sm-12 p");
            if (descEl != null) {
                description = descEl.text().trim();
                if (description.isBlank()) description = null;
            }

            Product p = new Product();
            p.setName(name);
            p.setUrl(url);
            p.setImageUrl(imageUrl);
            p.setPrice(price);
            p.setDescription(description);

            extractWeightFromName(p);
            extractBrandFromName(p);

            return p;
        } catch (Exception e) {
            log.warn("[{}] Failed to parse listing item: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private String parseListingPrice(Element item) {
        Element priceEl = item.selectFirst("span.price");
        if (priceEl == null) return null;
        String raw = priceEl.text().trim();
        // Format: "8.950,00 RSD" or "8.950,00 - 9.590,00 RSD"
        // Take minimum price from range
        if (raw.contains(" - ")) {
            String first = raw.split(" - ")[0].trim();
            return normalizePrice(first);
        }
        return normalizePrice(raw);
    }

    private String normalizePrice(String raw) {
        return raw.replaceAll("(?i)\\s*rsd\\s*", "").replaceAll("\\.", "").trim();
    }

    private void extractWeightFromName(Product p) {
        if (p.getName() == null) return;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE)
                .matcher(p.getName());
        while (m.find()) {
            String w = m.group().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(w)) p.getPackage_weight().add(w);
        }
        // Also set primaryWeightGrams from the match
        if (p.getPrimaryWeightGrams() == null && !p.getPackage_weight().isEmpty()) {
            p.setPrimaryWeightGrams(parseWeightToGrams(p.getPackage_weight().get(0)));
        }
    }

    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        // Known multi-word brand prefixes
        String name = p.getName();
        for (String[] entry : BRAND_PREFIXES) {
            if (name.toLowerCase().startsWith(entry[0].toLowerCase())) {
                p.setBrand(entry[1]);
                return;
            }
        }
        // Fallback: first word
        String first = name.split("\\s+")[0];
        p.setBrand(first);
    }

    private static final String[][] BRAND_PREFIXES = {
        { "ultimate nutrition", "Ultimate Nutrition" },
        { "basic supplements",  "Basic Supplements"  },
        { "biotech usa",        "BioTech"            },
        { "biotech",            "BioTech"            },
        { "the nutrition",      "THE Nutrition"      },
        { "the amino",          "THE Nutrition"      },
        { "muscle pharm",       "MusclePharm"        },
        { "musclepharm",        "MusclePharm"        },
        { "optimum nutrition",  "Optimum Nutrition"  },
        { "bs pro",             "Basic Supplements"  },
        { "scitec",             "Scitec Nutrition"   },
        { "kevin levrone",      "Kevin Levrone"      },
        { "gold standard",      "Optimum Nutrition"  },
    };

    // ── Detail page enrichment ───────────────────────────────────────────────────

    private void enrichWithDetails(Page page, List<Product> products, Set<String> skipUrls) {
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' — not a protein product", STORE_NAME, p.getName());
                continue;
            }
            if (skipUrls.contains(p.getUrl())) {
                log.debug("[{}] '{}' — nutrition already complete, skipping detail page", STORE_NAME, p.getName());
                restoreNutritionFromDb(p);
                continue;
            }

            try {
                long sleep = 4000 + ThreadLocalRandom.current().nextLong(5000);
                log.info("[{}] Sleeping {}s before '{}'...", STORE_NAME, sleep / 1000, p.getName());
                Thread.sleep(sleep);

                if (!navigateWithRetry(page, p.getUrl(), 3)) {
                    log.error("[{}] Failed to load '{}' — skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                if (isBlockedByFirewall(page)) {
                    log.error("[{}] FIREWALL DETECTED — stopping", STORE_NAME);
                    return;
                }

                simulateHumanBehavior(page);

                Document doc = Jsoup.parse(page.content());

                enrichImageFromDetail(doc, p);
                enrichDescriptionFromDetail(doc, p);
                enrichNutrition(doc, p);

                log.info("[{}] Enriched '{}' → price={}, protein={}, fat={}, sugar={}, cal={}",
                        STORE_NAME, p.getName(), p.getPrice(),
                        p.getProteinPer100g(), p.getFatPer100g(),
                        p.getSugarPer100g(), p.getCaloriePer100g());

                count++;
                if (count % 10 == 0) {
                    long batchSleep = 40000 + ThreadLocalRandom.current().nextLong(20000);
                    log.info("[{}] Batch pause {}s after {} products...", STORE_NAME, batchSleep / 1000, count);
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich '{}': {}", STORE_NAME, p.getName(), e.getMessage());
                safeSleep(5000);
            }
        }
    }

    private void enrichImageFromDetail(Document doc, Product p) {
        // Prefer larger product image from detail page
        for (String selector : List.of(
                "div.product-image img",
                "div.col-md-4 img.img-responsive",
                "div.col-sm-12 img.img-responsive"
        )) {
            Element img = doc.selectFirst(selector);
            if (img != null) {
                String src = img.attr("src");
                if (src.isBlank()) src = img.attr("data-src");
                if (!src.isBlank()) {
                    if (!src.startsWith("http")) src = BASE_URL + src;
                    p.setImageUrl(src);
                    return;
                }
            }
        }
    }

    private void enrichDescriptionFromDetail(Document doc, Product p) {
        for (String selector : List.of(
                "div.product-description",
                "div.tab-content div.tab-pane.active",
                "div#description",
                "div.product-body"
        )) {
            Element el = doc.selectFirst(selector);
            if (el != null) {
                String text = el.text().trim();
                if (!text.isBlank() && text.length() > 30) {
                    p.setDescription(text);
                    return;
                }
            }
        }
        // Fallback: grab main content paragraph
        Element mainContent = doc.selectFirst("div.col-md-8, div.col-md-9");
        if (mainContent != null) {
            Elements paras = mainContent.select("p");
            if (!paras.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (Element pa : paras) {
                    String t = pa.text().trim();
                    if (!t.isBlank()) sb.append(t).append("\n");
                }
                String text = sb.toString().trim();
                if (!text.isBlank()) p.setDescription(text);
            }
        }
    }

    // ── Nutrition extraction ─────────────────────────────────────────────────────

    private void enrichNutrition(Document doc, Product p) {
        extractNutritionFromTable(doc, p);

        if (p.getProteinPer100g() == null && p.getDescription() != null) {
            Double protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }

        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);

        log.info("[{}] '{}' → protein={}, fat={}, sugar={}, cal={}, source={}",
                STORE_NAME, p.getName(),
                p.getProteinPer100g(), p.getFatPer100g(),
                p.getSugarPer100g(), p.getCaloriePer100g(), p.getProteinSource());
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        try {
            for (Element table : doc.select("table")) {
                String tableText = table.text().toLowerCase();
                if (!tableText.contains("proteini") && !tableText.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // Detect which column contains per-100g values
                int per100gCol = detectPer100gColumn(rows.get(0));

                for (Element row : rows) {
                    Elements cells = row.select("td, th");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase()
                            .replaceAll("[*†‡§]", "").trim();
                    String rawCell = cells.get(per100gCol).text().trim();

                    // Energy: "1716 kJ / 405 kcal" — extract kcal specifically
                    if (label.contains("energetska") || label.contains("energy") || label.contains("kalorij")) {
                        Matcher kcalM = Pattern.compile("(\\d+[.,]?\\d*)\\s*kcal",
                                Pattern.CASE_INSENSITIVE).matcher(rawCell);
                        if (kcalM.find()) {
                            try {
                                double cal = Double.parseDouble(kcalM.group(1).replace(",", "."));
                                // Guard against per-serving values: realistic per-100g calorie ≥ 200
                                if (cal >= 200) p.setCaloriePer100g(cal);
                            } catch (Exception ignored) {}
                        }
                        continue;
                    }

                    String rawValue = rawCell.replaceAll("[^0-9,.]", "").replace(",", ".").trim();
                    if (rawValue.isBlank()) continue;
                    double value;
                    try { value = Double.parseDouble(rawValue); }
                    catch (Exception e) { continue; }
                    if (value < 0 || value > 1000) continue;

                    if ((label.contains("proteini") || label.contains("belančevine") || label.equals("protein"))
                            && !label.contains("koncentrat") && !label.contains("izvor") && !label.contains("surutke samo")) {
                        if (value > 0 && value <= 95) p.setProteinPer100g(value);
                    } else if ((label.equals("masti") || label.equals("fat") || label.equals("ukupne masti"))
                            && !label.contains("zasić")) {
                        if (value <= 100) p.setFatPer100g(value);
                    } else if ((label.contains("šećeri") || label.contains("seceri") || label.contains("sugar"))
                            && !label.contains("bez")) {
                        if (value <= 100) p.setSugarPer100g(value);
                    }
                }

                if (p.getProteinPer100g() != null) break;
            }
        } catch (Exception e) {
            log.warn("[{}] Nutrition table parse failed: {}", STORE_NAME, e.getMessage());
        }
    }

    private int detectPer100gColumn(Element headerRow) {
        Elements cells = headerRow.select("th, td");
        for (int i = 0; i < cells.size(); i++) {
            String text = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
            if (text.contains("100g") || text.contains("na100") || text.contains("per100")) {
                return i;
            }
        }
        return cells.size() >= 3 ? 2 : 1;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private void restoreNutritionFromDb(Product p) {
        productRepository.findByUrl(p.getUrl()).ifPresent(db -> {
            if (p.getProteinPer100g() == null) p.setProteinPer100g(db.getProteinPer100g());
            if (p.getFatPer100g() == null)     p.setFatPer100g(db.getFatPer100g());
            if (p.getSugarPer100g() == null)   p.setSugarPer100g(db.getSugarPer100g());
            if (p.getCaloriePer100g() == null) p.setCaloriePer100g(db.getCaloriePer100g());
            if (p.getProteinSource() == null)  p.setProteinSource(db.getProteinSource());
            if (p.getBrand() == null)          p.setBrand(db.getBrand());
        });
    }

    private Double parseWeightToGrams(String weight) {
        return weightParser.parse(weight);
    }

    private boolean navigateWithRetry(Page page, String url, int maxRetries) {
        for (int i = 0; i < maxRetries; i++) {
            try {
                page.navigate(url, new Page.NavigateOptions()
                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                        .setTimeout(25000));
                page.waitForTimeout(600 + ThreadLocalRandom.current().nextInt(1000));
                return true;
            } catch (Exception e) {
                log.warn("[{}] Navigate retry {}/{} for {}: {}", STORE_NAME, i + 1, maxRetries, url, e.getMessage());
                if (i < maxRetries - 1) safeSleep(2000L * (i + 1));
            }
        }
        return false;
    }

    private boolean isBlockedByFirewall(Page page) {
        try {
            String title = page.title();
            return title.contains("Cloudflare") || title.contains("Just a moment")
                    || title.contains("Attention Required") || title.contains("Access denied");
        } catch (Exception e) { return false; }
    }

    private void simulateHumanBehavior(Page page) {
        try {
            page.mouse().wheel(0, 250 + ThreadLocalRandom.current().nextInt(350));
            Thread.sleep(300 + ThreadLocalRandom.current().nextInt(400));
            page.mouse().wheel(0, 300 + ThreadLocalRandom.current().nextInt(250));
            Thread.sleep(200 + ThreadLocalRandom.current().nextInt(300));
            page.mouse().wheel(0, -100 - ThreadLocalRandom.current().nextInt(150));
            Thread.sleep(150 + ThreadLocalRandom.current().nextInt(200));
        } catch (Exception ignored) {}
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
