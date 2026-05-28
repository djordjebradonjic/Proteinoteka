package com.proteinoteka.service;

import com.microsoft.playwright.Page;
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
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class FitLabScraper implements StoreScraper {

    private static final String STORE_NAME = "FitLab";
    private static final String BASE_URL = "https://fitlab.rs/sr/suplementi/proteini";

    private final NutritionParserService nutritionParser;
    private final BaseScraperEnricher baseEnricher;


    @Override
    public String getStoreName() { return STORE_NAME; }

    @Override
    public String getBaseUrl() { return BASE_URL; }

    @Override
    public String buildPageUrl(int page) {
        return page == 0 ? BASE_URL : BASE_URL + "?page=" + (page + 1);
    }

    @Override
    public boolean hasNextPage(Document doc) {
        // Pagination div: flex justify-end items-center gap-2 py-4
        // Last button in it is the → button — disabled attr means no next page
        Element pagination = doc.selectFirst("div.flex.justify-end.items-center");
        if (pagination == null) return false;
        Elements buttons = pagination.select("button");
        if (buttons.isEmpty()) return false;
        Element nextBtn = buttons.last();
        return !nextBtn.hasAttr("disabled");
    }

    @Override
    public List<Product> scrape(Page page, Document doc) {
        List<Product> products = new ArrayList<>();

        Elements elements = doc.select("div[data-index]");
        log.info("[{}] Found {} products on listing page", STORE_NAME, elements.size());

        for (int i = 0; i < elements.size(); i++) {
            Product p = parseElement(elements.get(i));
            if (p != null) products.add(p);
        }

        if (page != null && !products.isEmpty()) {
            enrichWithDetails(page, products);
        }

        return products;
    }

    // -------------------- Listing parsing --------------------

    private Product parseElement(Element el) {
        try {
            Product p = new Product();

            Element titleLink = el.selectFirst("h2 a, a[href*='/proizvodi/']");
            if (titleLink == null) {
                for (Element link : el.select("a[href]")) {
                    if (link.attr("href").contains("/proizvodi/")) {
                        titleLink = link;
                        break;
                    }
                }
            }
            if (titleLink == null) return null;

            Element h2 = el.selectFirst("h2");
            if (h2 != null) {
                p.setName(ProductNameCleaner.clean(h2.text().trim()));
            } else {
                String ariaLabel = titleLink.attr("aria-label");
                String rawName = !ariaLabel.isBlank() ? ariaLabel.trim() : titleLink.text().trim();
                p.setName(ProductNameCleaner.clean(rawName));
            }

            String url = titleLink.attr("href");
            p.setUrl(url.startsWith("/") ? "https://fitlab.rs" + url : url);

            Element img = el.selectFirst("img");
            if (img != null) {
                String imgUrl = img.attr("src");
                String srcset = img.attr("srcset");
                if (!srcset.isEmpty()) {
                    String[] parts = srcset.split(",");
                    String largest = parts[parts.length - 1].trim().split("\\s+")[0];
                    imgUrl = largest.startsWith("/_next/") ? "https://fitlab.rs" + largest : largest;
                } else if (imgUrl.startsWith("/_next/")) {
                    imgUrl = "https://fitlab.rs" + imgUrl;
                }
                p.setImageUrl(imgUrl);
            }

            Element priceEl = el.selectFirst("span:contains(RSD)");
            if (priceEl == null) return null;

            String price = priceEl.text()
                    .replace("\u00a0", "")
                    .replaceAll("(?i)rsd", "")
                    .trim();
            p.setPrice(price);

            try {
                double numericPrice = Double.parseDouble(
                        price.replace(".", "").replace(",", ".").replaceAll("[^0-9.]", "")
                );
                if (numericPrice < 500) {
                    log.debug("[{}] Skipping '{}' - price {}RSD < 500RSD", STORE_NAME, p.getName(), numericPrice);
                    return null;
                }
            } catch (Exception e) {
                log.warn("[{}] Failed to parse price: '{}'", STORE_NAME, price);
            }

            extractBrandFromName(p);
            extractPackageWeightFromName(p);

            return p;
        } catch (Exception e) {
            log.error("[{}] Error parsing element: {}", STORE_NAME, e.getMessage());
            return null;
        }
    }

    private void extractBrandFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        String[] parts = p.getName().split("\\s+[–-]\\s+");
        if (parts.length >= 2) {
            String brand = parts[parts.length - 1].trim();
            if (!brand.isBlank()) p.setBrand(brand);
        }
    }

    private void extractPackageWeightFromName(Product p) {
        if (p.getName() == null || p.getName().isBlank()) return;
        Matcher m = Pattern.compile("(\\d+[.,]?\\d*\\s?(kg|g))", Pattern.CASE_INSENSITIVE).matcher(p.getName());
        while (m.find()) {
            String w = m.group().trim().replaceAll("\\s+", "");
            if (!p.getPackage_weight().contains(w)) p.getPackage_weight().add(w);
        }
    }

    // -------------------- Detail page enrichment --------------------

    private void enrichWithDetails(Page page, List<Product> products) {
        int count = 0;

        for (Product p : products) {
            if (p.getUrl() == null || p.getUrl().isBlank()) continue;
            if (baseEnricher.isNonProteinProduct(p.getName())) {
                log.info("[{}] Skipping '{}' - not a protein product", STORE_NAME, p.getName());
                continue;
            }


            try {
                long sleep = 10000 + ThreadLocalRandom.current().nextLong(10000);
                log.info("[{}] Sleeping {}s before enriching '{}'...", STORE_NAME, sleep / 1000, p.getName());
                Thread.sleep(sleep);

                boolean success = false;
                for (int retry = 0; retry < 3; retry++) {
                    try {
                        page.navigate(p.getUrl(), new Page.NavigateOptions()
                                .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                                .setTimeout(30000));

                        try {
                            // Čekaj da se tabela ili description učita
                            page.waitForSelector("table",
                                    new Page.WaitForSelectorOptions().setTimeout(8000));
                        } catch (Exception e) {
                            log.warn("[{}] Table selector timeout for {}", STORE_NAME, p.getUrl());
                        }

                        String title = page.title();
                        if (title.contains("Cloudflare") || title.contains("Attention Required")
                                || title.contains("Just a moment") || title.contains("Access denied")
                                || title.contains("Bot detection")) {
                            log.error("[{}] FIREWALL DETECTED! Stopping.", STORE_NAME);
                            return;
                        }

                        page.waitForTimeout(2000 + ThreadLocalRandom.current().nextInt(2000));
                        simulateReading(page);
                        success = true;
                        break;

                    } catch (Exception e) {
                        log.warn("[{}] Retry {}/3 for {}: {}", STORE_NAME, retry + 1, p.getUrl(), e.getMessage());
                        if (retry < 2) Thread.sleep(5000 * (retry + 1));
                    }
                }

                if (!success) {
                    log.error("[{}] Failed to load {} after 3 retries, skipping", STORE_NAME, p.getUrl());
                    continue;
                }

                Document doc = Jsoup.parse(page.content());

                enrichBrand(doc, p);
                enrichFlavours(doc, p);
                enrichPackageWeights(doc, p);
                enrichDescription(doc, p);
                enrichNutrition(doc, p);

                log.info("[{}] Enriched '{}' -> protein={}g, fat={}g, sugar={}g, cal={}",
                        STORE_NAME, p.getName(), p.getProteinPer100g(),
                        p.getFatPer100g(), p.getSugarPer100g(), p.getCaloriePer100g());

                count++;

                if (count % 5 == 0) {
                    long batchSleep = 60000 + ThreadLocalRandom.current().nextLong(60000);
                    log.info("[{}] Batch pause after {} products: {}s...", STORE_NAME, count, batchSleep / 1000);
                    // Navigate to blank to release Chromium's DOM/JS heap from previous pages.
                    try { page.navigate("about:blank"); } catch (Exception ignored) {}
                    Thread.sleep(batchSleep);
                }

            } catch (Exception e) {
                log.error("[{}] Failed to enrich {}: {}", STORE_NAME, p.getName(), e.getMessage());
                safeSleep(15000);
            }
        }
    }

    // -------------------- Nutrition extraction --------------------

    private void enrichNutrition(Document doc, Product p) {
        extractNutritionFromTable(doc, p);

        // Fallback for protein only
        if (p.getProteinPer100g() == null) {
            Double protein = extractProteinFromPlainText(doc);
            if (protein == null && p.getDescription() != null)
                protein = nutritionParser.extractProteinPer100g(p.getDescription());
            if (protein != null) p.setProteinPer100g(protein);
        }
        baseEnricher.enrichWithAiIfNeeded(doc, p, STORE_NAME);


        log.info("[{}] '{}' -> protein: {}, sugar: {}, fat: {}, cal: {}",
                STORE_NAME, p.getName(),
                p.getProteinPer100g(), p.getSugarPer100g(),
                p.getFatPer100g(), p.getCaloriePer100g());
    }

    private void extractNutritionFromTable(Document doc, Product p) {
        try {
            // FitLab ima tabelu sa headerom "Nutritivne informacije" i kolonama "30g | 100g"
            Elements tables = doc.select("table");

            for (Element table : tables) {
                String tableText = table.text().toLowerCase();
                if (!tableText.contains("proteini") && !tableText.contains("protein")) continue;

                Elements rows = table.select("tr");
                if (rows.isEmpty()) continue;

                // Detect 100g column — FitLab format: | Nutrient | 30g | 100g |
                int per100gCol = -1;
                for (Element row : rows) {
                    Elements cells = row.select("th, td");
                    for (int i = 0; i < cells.size(); i++) {
                        String cellText = cells.get(i).text().toLowerCase().replaceAll("\\s+", "");
                        if (cellText.equals("100g") || cellText.contains("na100g")) {
                            per100gCol = i;
                            break;
                        }
                    }
                    if (per100gCol >= 0) break;
                }

                if (per100gCol < 1) continue;

                // Parse each data row
                for (Element row : rows) {
                    Elements cells = row.select("td");
                    if (cells.size() <= per100gCol) continue;

                    String label = cells.get(0).text().trim().toLowerCase();
                    String rawValue = cells.get(per100gCol).text()
                            .replaceAll("[^0-9,.]", "").replace(",", ".").trim();

                    if (rawValue.isBlank()) continue;

                    double value;
                    try { value = Double.parseDouble(rawValue); }
                    catch (Exception e) { continue; }

                    if (value < 0 || value > 10000) continue;

                    // Protein
                    if (label.equals("proteini") || label.equals("protein")) {
                        if (value > 0 && value <= 95) p.setProteinPer100g(value);
                    }
                    // Fat — "masti" but not "zasićene masti"
                    else if ((label.equals("masti") || label.equals("fat"))
                            && !label.contains("zasić")) {
                        if (value <= 100) p.setFatPer100g(value);
                    }
                    // Sugar — "od čega šećeri"
                    else if (label.contains("šećeri") || label.contains("seceri")
                            || label.contains("sugar")) {
                        if (value <= 100) p.setSugarPer100g(value);
                    }
                    // Calories — "energijska vrednost" — FitLab format: "408 kcal / 1725 kJ"
                    else if (label.contains("energi") || label.contains("kalorij")
                            || label.contains("kcal")) {
                        // Take only kcal value (first number before "kcal")
                        String kcalRaw = cells.get(per100gCol).text();
                        java.util.regex.Matcher m = java.util.regex.Pattern
                                .compile("(\\d+[.,]?\\d*)\\s*kcal")
                                .matcher(kcalRaw);
                        if (m.find()) {
                            try {
                                p.setCaloriePer100g(Double.parseDouble(
                                        m.group(1).replace(",", ".")));
                            } catch (Exception ignored) {}
                        }
                    }
                }

                if (p.getProteinPer100g() != null) break;
            }

        } catch (Exception e) {
            log.warn("[{}] Failed to extract nutrition from table: {}", STORE_NAME, e.getMessage());
        }
    }

    private Double extractProteinFromPlainText(Document doc) {
        for (Element el : doc.select("p, div")) {
            String text = el.text();
            if (!text.toLowerCase().contains("protein")) continue;

            try {
                Matcher m = Pattern.compile("(\\d+[.,]?\\d*)\\s*%.*?protein", Pattern.CASE_INSENSITIVE).matcher(text);
                if (m.find()) {
                    double val = Double.parseDouble(m.group(1).replace(",", "."));
                    if (val > 0 && val <= 100) return val;
                }

                if (!text.toLowerCase().contains("100g")) continue;

                Matcher m2 = Pattern.compile(
                        "proteini[^/]*?(\\d+[.,]?\\d*)\\s*g\\s*/\\s*(\\d+[.,]?\\d*)\\s*g",
                        Pattern.CASE_INSENSITIVE).matcher(text);
                if (m2.find()) {
                    double val = Double.parseDouble(m2.group(2).replace(",", "."));
                    if (val > 0 && val <= 100) return val;
                }
            } catch (Exception e) {
                log.warn("[{}] Failed to parse plain text: {}", STORE_NAME, e.getMessage());
            }
        }
        return null;
    }

    // -------------------- Other enrichment --------------------

    private void enrichBrand(Document doc, Product p) {
        Element brandSchema = doc.selectFirst("[itemprop=brand]");
        if (brandSchema != null && !brandSchema.text().isBlank()) {
            p.setBrand(cleanBrand(brandSchema.text().trim()));
            return;
        }
        Element meta = doc.selectFirst("meta[property='product:brand']");
        if (meta != null && !meta.attr("content").isBlank())
            p.setBrand(cleanBrand(meta.attr("content").trim()));
    }

    private String cleanBrand(String raw) {
        if (raw.contains("/")) {
            String afterSlash = raw.substring(raw.lastIndexOf('/') + 1).trim();
            if (!afterSlash.isBlank()) raw = afterSlash;
        }
        return raw.replaceAll("^[★☆✦✧⭐*\\s]+", "").trim();
    }

    private void enrichFlavours(Document doc, Product p) {
        // Strategy 1 — select with "ukus"/"flavor" placeholder option (original approach)
        for (Element opt : doc.select("select option")) {
            String optText = opt.text().toLowerCase();
            if (optText.contains("ukus") || optText.contains("flavor") || optText.contains("ukusa")) {
                Element select = opt.parent();
                if (select != null) {
                    for (Element fo : select.select("option")) {
                        String text = fo.text().trim();
                        if (!fo.attr("value").isBlank() && !text.isBlank()
                                && !text.equals("--") && !p.getFlavours().contains(text))
                            p.getFlavours().add(text);
                    }
                }
                if (!p.getFlavours().isEmpty()) return;
            }
        }

        // Strategy 2 — any select whose options don't look like weights/sizes
        for (Element select : doc.select("select")) {
            Elements opts = select.select("option[value!='']");
            if (opts.size() < 2) continue;
            long weightCount = 0;
            for (Element o : opts) {
                if (o.text().trim().matches("(?i).*\\d+\\s*(g|kg|ml|l)\\b.*")) weightCount++;
            }
            if (weightCount < opts.size()) {
                for (Element o : opts) {
                    String text = o.text().trim();
                    if (!text.isBlank() && !text.equals("--") && !p.getFlavours().contains(text))
                        p.getFlavours().add(text);
                }
                if (!p.getFlavours().isEmpty()) return;
            }
        }

        // Strategy 3 — variant buttons/chips (React stores often avoid <select>)
        String[] variantSelectors = {
            "button[data-option-value]",
            "button[data-variant-id]",
            "[class*='swatch'] button",
            "[class*='variant'] button",
            "[class*='option-item'] button",
            "[class*='ProductVariant'] button",
            "[data-option-name*='ukus'] [role='radio']",
            "[data-option-name*='flavor'] [role='radio']",
            "label[data-value]"
        };
        for (String sel : variantSelectors) {
            Elements els = doc.select(sel);
            if (els.isEmpty()) continue;
            for (Element el : els) {
                String text = el.text().trim();
                if (text.isBlank()) text = el.attr("data-option-value").trim();
                if (text.isBlank()) text = el.attr("data-value").trim();
                if (text.isBlank()) text = el.attr("title").trim();
                if (!text.isBlank() && !p.getFlavours().contains(text))
                    p.getFlavours().add(text);
            }
            if (!p.getFlavours().isEmpty()) return;
        }
    }

    private void enrichPackageWeights(Document doc, Product p) {
        List<String> weights = new ArrayList<>();
        for (Element opt : doc.select("select option")) {
            String optText = opt.text().toLowerCase();
            if (optText.contains("pakovanje") || optText.contains("veličina") || optText.contains("gramaza")) {
                Element select = opt.parent();
                if (select != null) {
                    for (Element weightOpt : select.select("option")) {
                        String text = weightOpt.text().trim().replaceAll("\\s+", "");
                        if (!text.isBlank() && !text.equals("--") && !weights.contains(text))
                            weights.add(text);
                    }
                }
                break;
            }
        }
        if (!weights.isEmpty()) {
            p.getPackage_weight().clear();
            p.getPackage_weight().addAll(weights);
        }
    }

    private void enrichDescription(Document doc, Product p) {
        // FitLab description is in prose div
        Element descEl = doc.selectFirst("div.prose.productDesc");
        if (descEl != null && !descEl.text().isBlank()) {
            p.setDescription(descEl.text().trim());
            return;
        }

        // Fallback
        Element metaDesc = doc.selectFirst("meta[name=description]");
        if (metaDesc != null && !metaDesc.attr("content").isBlank())
            p.setDescription(metaDesc.attr("content").trim());
    }

    private void simulateReading(Page page) {
        try {
            int scrolls = 3 + ThreadLocalRandom.current().nextInt(4);
            for (int i = 0; i < scrolls; i++) {
                int delta = i == 0
                        ? 200 + ThreadLocalRandom.current().nextInt(400)
                        : (ThreadLocalRandom.current().nextBoolean() ? 1 : -1)
                          * (100 + ThreadLocalRandom.current().nextInt(500));
                page.mouse().wheel(0, delta);
                Thread.sleep(400 + ThreadLocalRandom.current().nextLong(800));
            }
        } catch (Exception ignored) {}
    }

    private void safeSleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}