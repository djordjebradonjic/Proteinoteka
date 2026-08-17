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
            "zero", "raw", "fusion", "powder", "instant", "formula", "anabolic"
    );

    public static Set<String> productLineWords(String name, String brand) {
        if (name == null) return Collections.emptySet();
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
        lower = lower.replaceAll("\\d+[.,]?\\d*\\s*(kg|g|gr\\b|lb\\b)", "");
        lower = lower.replaceAll("[^a-zčćšđž\\s]", " ");
        Set<String> words = new HashSet<>();
        for (String w : lower.split("\\s+")) {
            if (w.length() > 2 && !NAME_STOPWORDS.contains(w)) words.add(w);
        }
        return words;
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
