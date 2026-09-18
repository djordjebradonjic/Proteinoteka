package com.proteinoteka.util;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Shared word-overlap heuristic for telling apart distinct product lines that share a
 * brand, weight, and generic vocabulary (e.g. "Iso Cool" vs "Iso Sensation 93", both
 * Ultimate Nutrition). Any fuzzy/approximate product-identity match — whether grouping
 * products across stores or re-resolving a scraped item to an existing DB row — should
 * gate on this before trusting a numeric similarity score alone, since scores like
 * FuzzySearch.tokenSetRatio can't distinguish "Whey Gold" from "Iso Cool" when both
 * reduce to mostly-stopword names.
 */
public final class ProductLineMatcher {

    private ProductLineMatcher() {}

    // NOTE: isolate/izolat, casein/kazein, concentrate/koncentrat, hydrolysate/hidrolizat,
    // vegan, and blend are deliberately NOT stopwords — they're exactly the words that
    // distinguish different product lines at the same brand+weight (e.g. Maximalium's
    // "100% Whey Protein" blend vs "Isolate Whey Protein" are different SKUs at the same
    // weight; treating both as empty/generic previously merged them into one group).
    // "anabolic" is a generic marketing prefix like "gold"/"pro"/"ultra"/"premium" (already
    // stopworded below) — without it, e.g. Amix's "Anabolic Masster" (beef/collagen blend,
    // ~45% protein) and "Anabolic Monster Whey" (real whey concentrate, ~80% protein) both
    // reduce to a set containing "anabolic" and get treated as the same product line.
    private static final Set<String> NAME_STOPWORDS = Set.of(
            "whey", "protein", "proteini", "plant",
            "100", "pure", "natural", "ukus", "flavor", "flavour", "vanilla", "vanila",
            "chocolate", "cokolada", "sport", "nutrition", "the", "and", "with", "pro",
            "ultra", "gold", "lean", "diet", "basic", "complete", "premium", "iso",
            "zero", "raw", "fusion", "powder", "instant", "formula", "anabolic",
            // listing noise, never part of a product line's identity
            "gratis", "besplatno", "šejker", "shaker", "visokog", "kvaliteta", "kvalitete",
            "doza", "doze", "porcija", "porcije", "grama", "grams", "gram", "proteina"
    );

    // Serbian/Croatian vs English spellings of the words that DO distinguish lines. Without this
    // "Izolat whey protein" and "Isolate Whey Protein" (same Maximalium SKU) share no word.
    private static final java.util.Map<String, String> SYNONYMS = java.util.Map.ofEntries(
            java.util.Map.entry("izolat", "isolate"), java.util.Map.entry("izolata", "isolate"),
            java.util.Map.entry("izolate", "isolate"),
            java.util.Map.entry("kazein", "casein"), java.util.Map.entry("kazeina", "casein"),
            java.util.Map.entry("micelarni", "micellar"), java.util.Map.entry("micelarna", "micellar"),
            java.util.Map.entry("koncentrat", "concentrate"), java.util.Map.entry("koncentrata", "concentrate"),
            java.util.Map.entry("veganski", "vegan"), java.util.Map.entry("veganska", "vegan"),
            java.util.Map.entry("hidrolizat", "hydrolysate"), java.util.Map.entry("hidrolizovani", "hydrolysate"),
            java.util.Map.entry("hydrolyzed", "hydrolysate"), java.util.Map.entry("hydrolysed", "hydrolysate"),
            java.util.Map.entry("veggie", "vegan"), java.util.Map.entry("profesional", "professional")
    );

    public static Set<String> productLineWords(String name, String brand) {
        if (name == null) return Collections.emptySet();
        Set<String> words = new HashSet<>();
        for (String w : stripBrandAndWeight(name, brand).split("\\s+")) {
            w = SYNONYMS.getOrDefault(w, w);
            if (w.length() > 2 && !NAME_STOPWORDS.contains(w)) words.add(w);
        }
        return words;
    }

    /** Lower-cased name with brand words, weights and non-letters removed (words still separated). */
    private static String stripBrandAndWeight(String name, String brand) {
        String lower = name.toLowerCase();
        // Strip the brand word-by-word rather than as one exact phrase — names commonly
        // spell the brand as "Amix™"/"AMIX" while the brand field holds "Amix Nutrition",
        // so a whole-phrase match silently fails and the brand word (e.g. "amix") leaks
        // through as if it were a distinguishing word in every product from that brand,
        // which is enough to make otherwise-unrelated product lines look like matches.
        if (brand != null) {
            for (String brandWord : brand.toLowerCase().trim().split("\\s+")) {
                if (brandWord.length() > 1) lower = lower.replace(brandWord, "");
            }
        }
        // unit must end at a word boundary: "1000 grama" -> "", but "100 gold" must keep "gold"
        lower = lower.replaceAll("\\d+[.,]?\\d*\\s*(kg|grama|grams|gram|gr|g|lb)\\b", "");
        return lower.replaceAll("[^a-zčćšđž\\s]", " ");
    }

    /**
     * True when two names denote the same product line. Extends {@link #hasWordOverlap} with a
     * compound-word fallback: stores spell the same line as "Iso Sensation 93" and
     * "IsoSensation 93", "Iso Cool" and "IsoCool". A distinguishing word of at least 4 letters
     * that appears inside the other name once spaces are removed counts as a match. Still false
     * when only one side has distinguishing words (e.g. "Vegan Blend" vs "Protein boba").
     */
    public static boolean sameProductLine(String nameA, String brandA, String nameB, String brandB) {
        Set<String> a = productLineWords(nameA, brandA);
        Set<String> b = productLineWords(nameB, brandB);
        if (hasWordOverlap(a, b)) return true;
        if (a.isEmpty() || b.isEmpty()) return false;
        String compactA = stripBrandAndWeight(nameA, brandA).replaceAll("\\s+", "");
        String compactB = stripBrandAndWeight(nameB, brandB).replaceAll("\\s+", "");
        return containsAnyWord(compactB, a) || containsAnyWord(compactA, b);
    }

    private static boolean containsAnyWord(String compact, Set<String> words) {
        for (String w : words) {
            if (w.length() >= 4 && compact.contains(w)) return true;
        }
        return false;
    }

    public static boolean hasWordOverlap(Set<String> a, Set<String> b) {
        // Both empty → both are fully generic names (e.g. "Vegan Blend") → assume same line
        if (a.isEmpty() && b.isEmpty()) return true;
        // One side has distinguishing words, the other doesn't → different products (e.g.
        // "Protein boba" has "boba" but "Vegan Blend" reduces to empty → not the same line)
        if (a.isEmpty() || b.isEmpty()) return false;
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        return !intersection.isEmpty();
    }
}
