package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.util.BrandNameExtractor;
import com.proteinoteka.util.PackageWeights;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.math.BigDecimal;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Reads one category of a WooCommerce store through its public Store API
 * ({@code /wp-json/wc/store/v1/products}). The whole category — names, prices, stock, descriptions —
 * arrives in one or two small JSON requests (a full creatine category is ~10–40 KB gzipped) instead of a
 * browser navigation per listing page and per product, which is what makes it the cheapest way to add a
 * category on a store that sits behind the IPRoyal proxy.
 *
 * <p>Type-agnostic: it maps to plain {@link Product}s (name, brand, price, url, weight, description, the
 * variant label); what a product means for its family is decided later by the family's
 * {@code ProductTypeProfile}. Variants are collapsed to one row per pack size, priced at the cheapest
 * flavour, with a URL that names only the size — flavours change between runs, a URL must not.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WooStoreApiSource {

    private static final int PER_PAGE = 100;
    private static final int MAX_PAGES = 5;
    private static final int MAX_BODY_BYTES = 8 * 1024 * 1024;
    private static final int MAX_DESCRIPTION_CHARS = 4000;

    private static final Pattern SIZE_ATTRIBUTE = Pattern.compile(
            "pakovanj|pakiran|te[zž]in|velič|velic|koli[cč]in|size|weight|veličina", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern FLAVOUR_ATTRIBUTE = Pattern.compile(
            "ukus|okus|flavo", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern BRAND_ATTRIBUTE = Pattern.compile(
            "^brand|^brend|proizvo", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private final ProxyAwareHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final BrandNormalizerService brandNormalizer;

    /** Fetches and maps one category. Throws when the API answers with anything but JSON (a bot challenge, a 404). */
    public List<Product> fetch(ListingTarget.WooStoreApi source, Store store, boolean useProxy,
                               ProxyUsageMeter meter) throws IOException {
        String endpoint = trimSlash(source.origin()) + "/wp-json/wc/store/v1/products";
        List<JsonNode> parents = fetchAll(endpoint + "?category=" + enc(source.categorySlug())
                + "&per_page=" + PER_PAGE, useProxy, meter);

        List<String> variableIds = new ArrayList<>();
        for (JsonNode p : parents) {
            if ("variable".equals(p.path("type").asText())) variableIds.add(p.path("id").asText());
        }
        Map<Long, List<JsonNode>> variationsByParent = new LinkedHashMap<>();
        if (!variableIds.isEmpty()) {
            for (JsonNode v : fetchAll(endpoint + "?type=variation&parent=" + String.join(",", variableIds)
                    + "&per_page=" + PER_PAGE, useProxy, meter)) {
                variationsByParent.computeIfAbsent(v.path("parent").asLong(), k -> new ArrayList<>()).add(v);
            }
        }

        boolean eur = "EUR".equalsIgnoreCase(store.getCurrency());
        List<Product> products = new ArrayList<>();
        for (JsonNode parent : parents) {
            products.addAll(mapProduct(parent, variationsByParent.getOrDefault(parent.path("id").asLong(), List.of()), eur));
        }
        log.info("[{}] Woo Store API '{}': {} products → {} rows", store.getName(), source.categorySlug(),
                parents.size(), products.size());
        return products;
    }

    // ---------------------------------------------------------------- mapping (pure, unit-tested)

    /** Maps one Store API product and its variation items to rows; out-of-stock rows are dropped. */
    List<Product> mapProduct(JsonNode parent, List<JsonNode> variations, boolean eur) {
        String name = unescape(parent.path("name").asText(""));
        String permalink = parent.path("permalink").asText("");
        if (name.isBlank() || permalink.isBlank()) return List.of();

        boolean variable = "variable".equals(parent.path("type").asText()) && !variations.isEmpty();
        List<Product> rows = new ArrayList<>();
        if (!variable) {
            if (!parent.path("is_in_stock").asBoolean(true)) return List.of();
            double price = minorUnitPrice(parent.path("prices"));
            if (price <= 0 || price == Double.MAX_VALUE) return List.of();
            Product p = base(parent, name, permalink, eur, price);
            applySize(p, null, parent);
            rows.add(p);
            return rows;
        }

        // one row per pack size, priced at the cheapest in-stock flavour
        Map<String, JsonNode> cheapestBySize = new LinkedHashMap<>();
        Map<String, String> labelBySize = new LinkedHashMap<>();
        Map<String, String> urlBySize = new LinkedHashMap<>();
        for (JsonNode v : variations) {
            if (!v.path("is_in_stock").asBoolean(true)) continue;
            double vPrice = minorUnitPrice(v.path("prices"));
            if (vPrice <= 0 || vPrice == Double.MAX_VALUE) continue;
            SizeKey size = sizeOf(v, permalink);
            JsonNode current = cheapestBySize.get(size.key());
            if (current == null || minorUnitPrice(v.path("prices")) < minorUnitPrice(current.path("prices"))) {
                cheapestBySize.put(size.key(), v);
                labelBySize.put(size.key(), size.label());
                urlBySize.put(size.key(), size.url());
            }
        }
        for (Map.Entry<String, JsonNode> e : cheapestBySize.entrySet()) {
            Product p = base(parent, name, urlBySize.get(e.getKey()), eur, minorUnitPrice(e.getValue().path("prices")));
            applySize(p, labelBySize.get(e.getKey()), parent);
            rows.add(p);
        }
        return rows;
    }

    private Product base(JsonNode parent, String name, String url, boolean eur, double price) {
        Product p = new Product();
        p.setName(name);
        p.setUrl(url);
        p.setPrice(formatPrice(price, eur));
        p.setImageUrl(parent.path("images").path(0).path("src").asText(null));
        p.setDescription(descriptionOf(parent));
        p.setBrand(brandOf(parent, name));
        for (JsonNode attr : parent.path("attributes")) {
            if (FLAVOUR_ATTRIBUTE.matcher(attr.path("name").asText("")).find()) {
                for (JsonNode term : attr.path("terms")) {
                    String flavour = unescape(term.path("name").asText(""));
                    if (!flavour.isBlank() && !p.getFlavours().contains(flavour)) p.getFlavours().add(flavour);
                }
            }
        }
        return p;
    }

    /**
     * Pack weight in grams (from the variation's size label, else the title, else the size the product
     * states once for all its variations) plus the raw label for the type parsers ("60 tableta" carries
     * a count, not a weight).
     */
    private void applySize(Product p, String label, JsonNode parent) {
        String statedSize = label == null ? parentSizeLabel(parent) : null;
        p.setVariantLabel(label != null ? label : statedSize);
        Double grams = PackageWeights.grams(label);
        if (grams == null) grams = PackageWeights.grams(p.getName());
        if (grams == null) grams = PackageWeights.grams(statedSize);
        // Last resort for a single-size product: the store's own URL ("…/crea-pro-1000gr-kreatin-…/") often
        // carries the pack when the title only counts servings.
        if (grams == null && label == null) grams = weightInSlug(parent.path("permalink").asText(""));
        if (grams != null) {
            p.setPrimaryWeightGrams(grams);
            p.getPackage_weight().add(PackageWeights.label(grams));
        }
    }

    // A pack weight below this in a URL is a dose or a sachet, not the pack
    private static final double MIN_SLUG_WEIGHT_GRAMS = 50;

    /** The weight written in the last path segment of a product URL ("…-1000gr-…", "…-225-g/"), or null. */
    private static Double weightInSlug(String permalink) {
        String path = permalink.replaceAll("[?#].*$", "").replaceAll("/+$", "");
        String slug = path.substring(path.lastIndexOf('/') + 1).replace('-', ' ');
        Double grams = PackageWeights.grams(slug);
        return grams != null && grams >= MIN_SLUG_WEIGHT_GRAMS ? grams : null;
    }

    /**
     * A size attribute with a single term ("Pakiranje: 500g") describes the whole product. Proteini
     * Outlet publishes its pack size this way, and its variations only differ by flavour, so without this
     * none of its products would have a weight.
     */
    private static String parentSizeLabel(JsonNode parent) {
        for (JsonNode attr : parent.path("attributes")) {
            if (!SIZE_ATTRIBUTE.matcher(attr.path("name").asText("")).find()) continue;
            JsonNode terms = attr.path("terms");
            if (terms.size() != 1) continue;
            String label = unescape(terms.path(0).path("name").asText("")).trim();
            if (!label.isBlank()) return label;
        }
        return null;
    }

    private record SizeKey(String key, String label, String url) {}

    /**
     * The pack size of a variation item, from its "Pakovanje: 500g" style label. The URL keeps only the
     * size attribute of the variation's own permalink; a variation with no size attribute (flavours only)
     * collapses into one row at the product's permalink.
     */
    private SizeKey sizeOf(JsonNode variation, String parentPermalink) {
        String label = null;
        String param = null;
        for (String part : variation.path("variation").asText("").split(",\\s*")) {
            int colon = part.indexOf(':');
            if (colon < 0) continue;
            String attrName = part.substring(0, colon).trim();
            if (SIZE_ATTRIBUTE.matcher(attrName).find()) {
                label = unescape(part.substring(colon + 1).trim());
                param = queryParamFor(variation.path("permalink").asText(""), attrName);
                break;
            }
        }
        if (label == null) return new SizeKey("", null, parentPermalink);
        // Distinct sizes must get distinct URLs even when the permalink names no attribute: same
        // "?pakovanje=" convention the other multi-variant scrapers use.
        String pair = param != null ? param : "pakovanje=" + enc(label);
        String url = parentPermalink + (parentPermalink.contains("?") ? "&" : "?") + pair;
        return new SizeKey(label.toLowerCase(Locale.ROOT), label, url);
    }

    /** "attribute_pa_pakovanje=500g" from a variation permalink for the attribute named "Pakovanje". */
    private static String queryParamFor(String permalink, String attributeName) {
        int q = permalink.indexOf('?');
        if (q < 0) return null;
        String slug = attributeName.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", "");
        for (String pair : permalink.substring(q + 1).split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String key = pair.substring(0, eq).toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", "");
            if (key.startsWith("attribute") && key.endsWith(slug)) return pair;
        }
        return null;
    }

    private String brandOf(JsonNode parent, String name) {
        String fromApi = parent.path("brands").path(0).path("name").asText("");
        if (!fromApi.isBlank()) return unescape(fromApi);
        for (JsonNode attr : parent.path("attributes")) {
            if (BRAND_ATTRIBUTE.matcher(attr.path("name").asText("")).find()) {
                String term = attr.path("terms").path(0).path("name").asText("");
                if (!term.isBlank()) return unescape(term);
            }
        }
        Optional<String> known = brandNormalizer.findKnownBrandIn(name);
        return known.orElseGet(() -> BrandNameExtractor.fromName(name));
    }

    private static String descriptionOf(JsonNode product) {
        String html = product.path("description").asText("");
        if (html.isBlank()) html = product.path("short_description").asText("");
        if (html.isBlank()) return null;
        String text = Jsoup.parse(html).text();
        return text.length() > MAX_DESCRIPTION_CHARS ? text.substring(0, MAX_DESCRIPTION_CHARS) : text;
    }

    /** Store API prices are integers in the currency's minor unit ("299000" with minor unit 2 = 2990.00). */
    static double minorUnitPrice(JsonNode prices) {
        String raw = prices.path("price").asText("");
        if (raw.isBlank()) return Double.MAX_VALUE;
        int minor = prices.path("currency_minor_unit").asInt(2);
        return new BigDecimal(raw).movePointLeft(minor).doubleValue();
    }

    // RSD is written as a rounded whole number ("2990"), like the other RSD scrapers; EUR keeps its cents.
    static String formatPrice(double price, boolean eur) {
        if (!eur) return String.valueOf(Math.round(price));
        return BigDecimal.valueOf(price).stripTrailingZeros().toPlainString();
    }

    private static String unescape(String s) {
        return Parser.unescapeEntities(s, false).trim();
    }

    // ---------------------------------------------------------------- transport

    // A creatine listing that fails is not retried by the scheduler (a retry would double proxy traffic),
    // so one timed-out request would leave the store without creatine for a whole week. One more attempt
    // covers a passing network hiccup; an HTTP error or a bot challenge is an answer, not a hiccup, and
    // is never repeated.
    private static final int TRANSPORT_ATTEMPTS = 2;
    long retryDelayMs = 3000;

    private Connection.Response execute(String url, boolean useProxy) throws IOException {
        for (int attempt = 1; ; attempt++) {
            try {
                return httpClient.connection(url, useProxy)
                        .ignoreContentType(true)
                        .ignoreHttpErrors(true)
                        .maxBodySize(MAX_BODY_BYTES)
                        .header("Accept", "application/json")
                        .method(Connection.Method.GET)
                        .execute();
            } catch (SocketTimeoutException | SocketException e) {
                if (attempt >= TRANSPORT_ATTEMPTS) throw e;
                log.warn("Store API request failed ({}), retrying in {} ms: {}", e.getMessage(), retryDelayMs, url);
                try {
                    Thread.sleep(retryDelayMs);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new InterruptedIOException("interrupted while waiting to retry " + url);
                }
            }
        }
    }

    private List<JsonNode> fetchAll(String url, boolean useProxy, ProxyUsageMeter meter) throws IOException {
        List<JsonNode> all = new ArrayList<>();
        int totalPages = 1;
        for (int page = 1; page <= totalPages && page <= MAX_PAGES; page++) {
            Connection.Response res = execute(url + "&page=" + page, useProxy);
            if (useProxy && meter != null) meter.addResponse(res);
            if (res.statusCode() != 200) {
                throw new IOException("Store API " + res.statusCode() + " for " + url);
            }
            String contentType = res.contentType();
            if (contentType == null || !contentType.toLowerCase(Locale.ROOT).contains("json")) {
                throw new IOException("Store API answered " + contentType + " instead of JSON (bot challenge?) for " + url);
            }
            JsonNode body = objectMapper.readTree(res.body());
            if (!body.isArray()) throw new IOException("Store API answered a non-array body for " + url);
            body.forEach(all::add);
            String pages = res.header("X-WP-TotalPages");
            if (pages != null) {
                try { totalPages = Integer.parseInt(pages.trim()); } catch (NumberFormatException ignored) { }
            }
        }
        return all;
    }

    private static String trimSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
