package com.proteinoteka.service;


import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class NutritionParserService {

    public Double extractProteinPer100g(String description) {
        if (description == null || description.isBlank()) return null;

        String text = Jsoup.parse(description).text();

        Pattern p0 = Pattern.compile(
                "(\\d+[.,]?\\d*)\\s*g\\s*/\\s*100\\s*g",
                Pattern.CASE_INSENSITIVE
        );
        Matcher m0 = p0.matcher(text);
        if (m0.find()) {
            double val = parseDouble(m0.group(1));
            if (val > 0 && val <= 100) {
                log.info("Extracted protein per 100g (explicit notation): {}g/100g", val);
                return val;
            }
        }

        // Pattern 1: "Proteini 22 g 75 g" → uzmi drugi broj (na 100g)
        // Pansport format: porcija prvo, pa 100g
        Pattern p1 = Pattern.compile(
                "Proteini\\s+(\\d+[.,]?\\d*)\\s*g\\s+(\\d+[.,]?\\d*)\\s*g",
                Pattern.CASE_INSENSITIVE
        );
        Matcher m1 = p1.matcher(text);
        if (m1.find()) {
            double first = parseDouble(m1.group(1));
            double second = parseDouble(m1.group(2));
            // Na 100g uvek veći broj
            double per100g = Math.max(first, second);
            if (per100g > 0 && per100g <= 100) {
                log.info("Extracted protein: {}g/100g", per100g);
                return per100g;
            }
        }

        // Pattern 2: "X g proteina po porciji" ili "Xg proteina"
        Pattern p2 = Pattern.compile(
                "(\\d+[.,]?\\d*)\\s*g\\s+proteina",
                Pattern.CASE_INSENSITIVE
        );
        Matcher m2 = p2.matcher(text);
        if (m2.find()) {
            double val = parseDouble(m2.group(1));
            if (val > 0 && val <= 100) {
                log.info("Extracted protein from text: {}g", val);
                return val;
            }
        }

        // Do 73% proteina" ili "75% proteina"
        Pattern p3 = Pattern.compile(
                "(\\d+[.,]?\\d*)\\s*%\\s*proteina",
                Pattern.CASE_INSENSITIVE
        );
        Matcher m3 = p3.matcher(text);
        if (m3.find()) {
            double val = parseDouble(m3.group(1));
            if (val > 0 && val <= 100) {
                log.info("Extracted protein from percentage: {}%", val);
                return val;
            }
        }

        return null;
    }

    private double parseDouble(String s) {
        try {
            return Double.parseDouble(s.replace(",", "."));
        } catch (Exception e) {
            return 0.0;
        }
    }
}