package com.proteinoteka.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PriceParser {

    public Double parse(String priceStr) {
        if (priceStr == null || priceStr.trim().isEmpty()) return null;

        String s = priceStr.trim();

        try {
            // Ukloni sve osim cifara, zareza i tacke
            s = s.replaceAll("[^0-9.,]", "");

            if (s.isEmpty()) return null;

            int lastDot   = s.lastIndexOf('.');
            int lastComma = s.lastIndexOf(',');

            if (lastComma > lastDot) {
                // Srpski/EU format: "1.950,00" ili "950,00"
                // Zarez je decimalni separator
                s = s.replace(".", "").replace(",", ".");

            } else if (lastDot > lastComma && lastComma >= 0) {
                // Americki format: "1,950.00"
                // Tacka je decimalni separator, zarez je hiljadar
                s = s.replace(",", "");

            } else if (lastDot >= 0 && lastComma < 0) {
                // Samo tacka, bez zareza: "2.490" ili "2.49" ili "1950.00"
                String afterDot = s.substring(lastDot + 1);

                if (afterDot.length() == 3) {
                    // "2.490" → tacka je hiljadar separator (srpski bez decimala)
                    s = s.replace(".", "");
                }
                // else: "1950.00" ili "2.49" → tacka je decimalni, ostavi kako jeste

            } else if (lastComma >= 0 && lastDot < 0) {
                // Samo zarez, bez tacke: "950,00"
                s = s.replace(",", ".");
            }

            double value = Double.parseDouble(s);

            if (value <= 0) {
                log.warn("Parsed price <= 0 for input '{}'", priceStr);
                return null;
            }
            if (value > 500_000) {
                log.warn("Suspiciously high price for input '{}': {}", priceStr, value);
            }

            return value;

        } catch (Exception e) {
            log.warn("Price parse failed for '{}': {}", priceStr, e.getMessage());
            return null;
        }
    }
}