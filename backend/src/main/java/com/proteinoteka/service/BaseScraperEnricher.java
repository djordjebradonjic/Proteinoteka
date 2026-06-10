package com.proteinoteka.service;

import com.proteinoteka.dto.NutritionDataDTO;
import com.proteinoteka.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BaseScraperEnricher {

    private final AiNutritionService aiNutritionService;

    /**
     * Fills null nutrition fields using AI.
     * Call this after table parsing in every scraper.
     */
    public void enrichWithAiIfNeeded(Document doc, Product p, String storeName) {
        if (isNonProteinProduct(p.getName())) {
            log.info("[{}] '{}' -> Skipping AI - not a protein product", storeName, p.getName());
            return;
        }

        calculateCaloriesIfPossible(p);

        if (allNutritionFieldsFilled(p)) return;

        String context = buildContext(doc, p);
        if (context.isBlank()) {
            log.warn("[{}] '{}' -> No context for AI enrichment", storeName, p.getName());
            return;
        }

        log.info("[{}] '{}' -> Calling AI to fill missing fields", storeName, p.getName());

        try {
            NutritionDataDTO data = aiNutritionService.extractNutritionData(
                    p.getName(), context, p.getPackage_weight()
            );

            if (data == null) {
                log.warn("[{}] '{}' -> AI returned null", storeName, p.getName());
                return;
            }

            // Allow AI to correct if protein is missing OR suspiciously low (likely per-serving value)
            boolean proteinSuspect = p.getProteinPer100g() != null && p.getProteinPer100g() < 35;
            if ((p.getProteinPer100g() == null || proteinSuspect) && data.getProteinPer100g() != null
                    && data.getProteinPer100g() > 0 && data.getProteinPer100g() <= 95)
                p.setProteinPer100g(data.getProteinPer100g());

            if (p.getSugarPer100g() == null && data.getSugarPer100g() != null)
                p.setSugarPer100g(data.getSugarPer100g());

            if (p.getFatPer100g() == null && data.getFatPer100g() != null)
                p.setFatPer100g(data.getFatPer100g());

            if (p.getCaloriePer100g() == null && data.getCaloriePer100g() != null)
                p.setCaloriePer100g(data.getCaloriePer100g());

            if (p.getProteinSource() == null && data.getProteinSource() != null)
                p.setProteinSource(data.getProteinSource());

            if (p.getPrimaryWeightGrams() == null && data.getPrimaryWeightGrams() != null)
                p.setPrimaryWeightGrams(data.getPrimaryWeightGrams());

        } catch (Exception e) {
            log.error("[{}] '{}' -> AI enrichment failed: {}", storeName, p.getName(), e.getMessage());
        }
    }

    private boolean allNutritionFieldsFilled(Product p) {
        return p.getProteinPer100g() != null
                && p.getSugarPer100g() != null
                && p.getFatPer100g() != null
                && p.getCaloriePer100g() != null
                && p.getProteinSource() != null;
    }

    private String buildContext(Document doc, Product p) {
        StringBuilder context = new StringBuilder();

        // Add description - povećano na 2000
        if (p.getDescription() != null && !p.getDescription().isBlank()) {
            int len = Math.min(p.getDescription().length(), 2000);
            context.append(p.getDescription(), 0, len);
            context.append("\n\n");
        }

        // Serving size hint - iz celog description, ne trimovanog
        String desc = p.getDescription() != null ? p.getDescription() : "";
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(\\d+)\\s*g[^\\w]*(porcij|merici|serving|po porciji)",
                        java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(desc);
        if (m.find()) {
            context.append("Serving size hint: ").append(m.group(1)).append("g\n\n");
        }

        // Add nutrition table text
        for (Element table : doc.select("table")) {
            String tableText = table.text();
            if (tableText.toLowerCase().contains("protein")
                    || tableText.toLowerCase().contains("nutritiv")
                    || tableText.toLowerCase().contains("energetska")) {
                int len = Math.min(tableText.length(), 600);
                context.append(tableText, 0, len);
                context.append("\n");
                break;
            }
        }

        return context.toString().trim();
    }

    public boolean isNonProteinProduct(String name) {
        if (name == null) return true;
        String lower = name.toLowerCase();
        return lower.contains("collagen") || lower.contains("kolagen") || lower.contains("kolostrum") ||
                lower.contains("gainer") || lower.contains("myogainer") ||
                lower.contains("hyper mass") || lower.contains("pro mass") ||
                lower.contains("beefmass") || lower.contains("instant mass") ||
                lower.contains("namaz") || lower.contains("keks") || lower.contains("kaša") ||
                lower.contains("dekstroza") || lower.contains("dextrose") ||
                lower.contains("+ creatine") || lower.contains("+ kreatin") ||
                lower.contains("gratis kreatin") ||
                lower.contains("cap") || lower.contains("kapsula") ||
                lower.contains("tableta") ||
                lower.contains("vitamin") || lower.contains("mineral") ||
                lower.contains("omega") || lower.contains("zma") ||
                lower.contains("thyro") || lower.contains("fat burn") ||
                lower.contains("pre-workout") || lower.contains("preworkout") ||
                lower.contains("čokoladica") || lower.contains("cokoladica") ||
                lower.contains("barebells") ||
                lower.contains("protein bar") || lower.contains("proteinbar") ||
                lower.contains("protein wafer") || lower.contains("protein cookie") ||
                lower.contains("protein brownie") || lower.contains("protein crisp") ||
                lower.contains("protein muffin") || lower.contains("protein pancake") ||
                lower.contains("protein chip") || lower.contains("protein snack") ||
                lower.contains("protein food") || lower.contains("protein desert") ||
                lower.contains("protein dessert") ||
                lower.contains("waffle") || lower.contains("vafla") ||
                lower.contains("trail mix") ||
                lower.contains("oats & whey") || lower.contains("oats and whey") ||
                lower.contains("ovsena") ||
                lower.contains(" paket ") || lower.contains(" paket") && lower.contains("masu") ||
                lower.contains("crunchy") && lower.contains("%") ||
                (lower.contains(" bar ") && !lower.contains("whey")) ||
                lower.endsWith(" bar") && !lower.contains("whey");
    }

    private void calculateCaloriesIfPossible(Product p) {
        if (p.getCaloriePer100g() != null) return;
        if (p.getProteinPer100g() != null && p.getFatPer100g() != null && p.getSugarPer100g() != null) {
            double calories = (p.getProteinPer100g() * 4) + (p.getFatPer100g() * 9) + (p.getSugarPer100g() * 4);
            p.setCaloriePer100g(Math.round(calories * 10.0) / 10.0);
            log.info("[{}] Calories calculated from formula: {}", p.getName(), p.getCaloriePer100g());
        }
    }


}