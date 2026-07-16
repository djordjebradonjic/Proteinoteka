package com.proteinoteka.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Some store sites have a typo in the package title — "2,3g" instead of "2,3kg" —
 * for what is clearly a multi-kilogram tub. A decimal-comma weight parsed as grams
 * below this bound is physically impossible for a whey/casein/gainer package, so we
 * treat it as a kg typo instead. Whole-number "g" values (e.g. "500g", "908g") are
 * left untouched — those are real small packages.
 */
@Component
@Slf4j
public class WeightParser {

    private static final double IMPLAUSIBLE_GRAM_THRESHOLD = 150.0;
    private static final Pattern DECIMAL_GRAM_PATTERN = Pattern.compile(".*\\d[.,]\\d+\\s*g\\s*$", Pattern.CASE_INSENSITIVE);

    public Double parse(String weight) {
        if (weight == null) return null;
        try {
            String w = weight.toLowerCase().replace(",", ".").replaceAll("\\s+", "");
            double value;
            if (w.contains("kg")) {
                value = Double.parseDouble(w.replace("kg", "")) * 1000;
            } else if (w.contains("g")) {
                value = Double.parseDouble(w.replace("g", ""));
            } else {
                return null;
            }

            if (value < IMPLAUSIBLE_GRAM_THRESHOLD && DECIMAL_GRAM_PATTERN.matcher(weight.trim()).matches()) {
                log.warn("Weight '{}' parsed as {}g is implausible — treating as a kg typo, using {}g", weight, value, value * 1000);
                value *= 1000;
            }

            return value;
        } catch (Exception e) {
            log.warn("Weight parse failed for '{}': {}", weight, e.getMessage());
            return null;
        }
    }
}
