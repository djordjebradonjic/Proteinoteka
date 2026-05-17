package com.proteinoteka.util;

import java.util.regex.Pattern;

/**
 * Strips garbage text that FitLab (and potentially other scrapers) append to
 * product names when h2.text() captures sibling DOM nodes alongside the title.
 *
 * Rules applied in order:
 *  1. Leading discount prefix  — "-15% " or "20% " at start
 *  2. "Kategorija" and everything after it (case-insensitive)
 *  3. Trailing price           — "2.490 RSD" or "2.490,00 din" patterns
 *  4. Trailing action text     — "Nema na stanju", "Dodaj u korpu", "Na stanju"
 *  5. Trailing stray dash      — " -" or "- " left after previous strips
 *  6. Final trim
 */
public final class ProductNameCleaner {

    private ProductNameCleaner() {}

    // 1. Leading discount: 1-2 digit percentage at start — e.g. "-15% " or "20% ".
    //    Capped at 2 digits so "100% Whey" (product name) is never matched.
    private static final Pattern LEADING_DISCOUNT =
            Pattern.compile("^-?\\d{1,2}%\\s*");

    // 2. "Kategorija" and everything after (greedy, case-insensitive)
    private static final Pattern KATEGORIJA_SUFFIX =
            Pattern.compile("\\s*Kategorija.*$", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    // 3. Trailing price: whitespace + number + optional separators + RSD/din keyword + rest
    private static final Pattern TRAILING_PRICE =
            Pattern.compile("\\s+\\d[\\d.,]*\\s*(RSD|rsd|din).*$", Pattern.DOTALL);

    // 4. Trailing action text
    private static final Pattern TRAILING_ACTION =
            Pattern.compile(
                    "\\s+(Nema na stanju|Dodaj u korpu|Na stanju).*$",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    // 5. Trailing stray dash (with surrounding spaces)
    private static final Pattern TRAILING_DASH =
            Pattern.compile("\\s*-\\s*$");

    public static String clean(String raw) {
        if (raw == null || raw.isBlank()) return raw;

        String s = raw;
        s = LEADING_DISCOUNT.matcher(s).replaceFirst("");
        s = KATEGORIJA_SUFFIX.matcher(s).replaceFirst("");
        s = TRAILING_PRICE.matcher(s).replaceFirst("");
        s = TRAILING_ACTION.matcher(s).replaceFirst("");
        s = TRAILING_DASH.matcher(s).replaceFirst("");
        return s.trim();
    }
}
