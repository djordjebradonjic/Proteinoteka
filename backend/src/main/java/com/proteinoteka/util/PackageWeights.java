package com.proteinoteka.util;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pack weight written in a listing title or variant label ("500g", "1kg", "2,27 kg", "150 gr").
 * Pure and product-type agnostic; a weight given in milligrams ("5000mg") is never a pack weight.
 */
public final class PackageWeights {

    private PackageWeights() {}

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
            | Pattern.UNICODE_CHARACTER_CLASS;

    // The number must not be the tail of a longer one ("2,27 kg" must not also match at "27"), but a
    // comma right after a word is only punctuation: "MONOHYDRATE,300g" is 300 g.
    private static final Pattern GRAMS = Pattern.compile(
            "(?<!\\d)(?<!\\d[.,])(\\d{1,4}(?:[.,]\\d{1,3})?)\\s*(kg|kilogram\\p{L}*|gram\\p{L}*|gr|g)(?![\\p{L}\\d])", FLAGS);

    private static final double MAX_PLAUSIBLE_GRAMS = 20_000;

    /** First g/kg amount in the text, in grams; {@code null} when there is none. */
    public static Double grams(String text) {
        if (text == null) return null;
        Matcher m = GRAMS.matcher(text);
        if (!m.find()) return null;
        String number = m.group(1);
        boolean kg = m.group(2).toLowerCase(Locale.ROOT).startsWith("k");
        // "1.000 g" is a thousands separator, "1.5 g" a decimal; a kg amount is always a decimal.
        number = (!kg && number.matches("\\d{1,3}[.,]\\d{3}"))
                ? number.replace(".", "").replace(",", "")
                : number.replace(',', '.');
        double grams = Double.parseDouble(number) * (kg ? 1000.0 : 1.0);
        return grams > 0 && grams <= MAX_PLAUSIBLE_GRAMS ? grams : null;
    }

    /** Compact display form used in {@code Product.package_weight}: "500g", "2kg". */
    public static String label(double grams) {
        long g = Math.round(grams);
        return g % 1000 == 0 ? (g / 1000) + "kg" : g + "g";
    }
}
