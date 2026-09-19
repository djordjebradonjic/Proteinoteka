package com.proteinoteka.util;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Best-effort brand from a listing title that has a recognisable "Product – Brand, size" shape
 * (Serbian and Croatian stores write it that way):
 * <pre>
 *   Creatine Monohydrate – Genius Nutrition, 133 porcije   -> Genius Nutrition
 *   Creatine monohydrate | DY Nutrition, 60 porcija        -> DY Nutrition
 *   CREAPURE CREATINE MONOHYDRATE 500G, 7NUTRITION         -> 7NUTRITION
 * </pre>
 * This is the fallback for brands that are not in {@code brand_reputation}; when the title does not
 * have that shape the result is {@code null} rather than a guess, because a wrong brand splits or
 * merges product groups.
 */
public final class BrandNameExtractor {

    private BrandNameExtractor() {}

    // The last " – ", " — ", " | " or " - " in the title; the brand runs up to the next , / or (
    private static final Pattern AFTER_SEPARATOR = Pattern.compile(
            "\\s[–—|-]\\s+([^,/(]+?)\\s*(?:[,/(]|$)");
    private static final Pattern AFTER_LAST_COMMA = Pattern.compile(",\\s*([^,]+?)\\s*$");

    private static final Set<String> NOT_A_BRAND = Set.of(
            "unflavoured", "unflavored", "natural", "neutral", "neutralan", "bez okusa", "bez ukusa",
            "okus", "ukus", "prah", "powder", "capsules", "kapsule", "tablets", "tablete",
            "monohydrate", "monohidrat", "creatine", "kreatin", "micronized", "mikronizirani");

    public static String fromName(String name) {
        if (name == null || name.isBlank()) return null;

        String candidate = null;
        Matcher m = AFTER_SEPARATOR.matcher(name);
        while (m.find()) candidate = m.group(1); // the last separator wins ("X – Y – Brand")
        if (!plausible(candidate)) {
            Matcher c = AFTER_LAST_COMMA.matcher(name);
            candidate = c.find() ? c.group(1) : null;
        }
        return plausible(candidate) ? candidate.trim() : null;
    }

    private static boolean plausible(String s) {
        if (s == null) return false;
        String t = s.trim();
        if (t.length() < 2 || t.length() > 30) return false;
        if (t.split("\\s+").length > 3) return false;
        if (NOT_A_BRAND.contains(t.toLowerCase(Locale.ROOT))) return false;
        // a size ("60 porcija", "500g", "2kg") or a pure number is not a brand
        if (t.matches("(?i).*\\d+\\s*(g|gr|kg|ml|porcij\\S*|doz\\S*|kesic\\S*|kapsul\\S*|tablet\\S*|serving\\S*).*")) return false;
        return t.matches(".*\\p{L}.*");
    }
}
