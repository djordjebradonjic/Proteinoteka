package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.dto.NutritionDataDTO;
import com.proteinoteka.dto.NutritionDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiNutritionService {

    @Value("${anthropic.api.key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NutritionDataDTO extractNutritionData(String productName, String description, List<String> packageWeights) {
        return callAi(productName, description, buildPrompt(productName, description, packageWeights));
    }

    public NutritionDataDTO extractCreatineNutritionData(String productName, String description, List<String> packageWeights) {
        return callAi(productName, description, buildCreatinePrompt(productName, description, packageWeights));
    }

    private NutritionDataDTO callAi(String productName, String description, String prompt) {
        if (description == null || description.isBlank()) return null;

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "claude-haiku-4-5-20251001");
            requestBody.put("max_tokens", 300);
            requestBody.put("messages", List.of(
                    Map.of("role", "user", "content", prompt)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Anthropic API error: {} {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            String text = root.path("content").get(0).path("text").asText().trim();

            log.info("AI response for '{}': {}", productName, text);

            // Clean JSON if wrapped in markdown code blocks
            text = text.replaceAll("```json", "").replaceAll("```", "").trim();

            return objectMapper.readValue(text, NutritionDataDTO.class);

        } catch (Exception e) {
            log.error("AI nutrition extraction failed for '{}': {}", productName, e.getMessage());
            return null;
        }
    }

    private String buildPrompt(String productName, String description, List<String> packageWeights) {
        String trimmed = description.length() > 2000
                ? description.substring(0, 2000)
                : description;

        String weights = packageWeights != null ? packageWeights.toString() : "unknown";

        return """
    Analyze this protein supplement and extract nutrition data.
    Return ONLY a JSON object, no explanation, no markdown.
                
    JSON format:
    {
      "proteinPer100g": <number or null>,
      "sugarPer100g": <number or null>,
      "fatPer100g": <number or null>,
      "caloriePer100g": <number or null>,
      "proteinSource": <"whey_concentrate"|"whey_isolate"|"hydrolysate"|"vegan"|"casein"|"blend"|"egg"|null>,
      "primaryWeightGrams": <total package weight in grams as number or null>
    }
                
    CRITICAL RULES — read carefully:
    - proteinPer100g MUST be per 100g of product, NOT per serving
    - Valid range for proteinPer100g: 15–95g. If result is outside this range, you made an error.
    - If you see "Na 100g" column → use that value directly
    - If you see only per-serving values → divide by serving size and multiply by 100
      Example: 24g protein per 30g serving → (24/30)*100 = 80g per 100g
    - If serving size is NOT mentioned and value looks like per-serving (e.g. 20-30g protein) → convert assuming 30g serving
    - NEVER return values like 22, 24, 25 for proteinPer100g — these are per-serving values
    - primaryWeightGrams: total package weight in grams (e.g. 2kg = 2000, 908g = 908)
    - proteinSource: best match from allowed values only ("egg" for egg white / egg albumin protein)
    - All values must be numbers, not strings
    - If no nutrition data exists at all, return null for all numeric fields
                
    Product: %s
    Package weights available: %s
    Description: %s
    """.formatted(productName, weights, trimmed);
    }

    private String buildCreatinePrompt(String productName, String description, List<String> packageWeights) {
        String trimmed = description.length() > 2000
                ? description.substring(0, 2000)
                : description;

        String weights = packageWeights != null ? packageWeights.toString() : "unknown";

        return """
    Analyze this creatine supplement and extract dosing data.
    Return ONLY a JSON object, no explanation, no markdown.

    JSON format:
    {
      "creatineGramsPerServing": <number or null>,
      "servingsPerContainer": <integer or null>,
      "creatineType": <"monohydrate"|"hcl"|"micronized"|"buffered"|"blend"|null>,
      "primaryWeightGrams": <total package weight in grams as number or null>
    }

    CRITICAL RULES — read carefully:
    - creatineGramsPerServing is the amount of creatine per single serving/dose (typically 3-10g)
    - servingsPerContainer is how many servings the whole package provides
    - creatineType: best match from allowed values only; default to "monohydrate" if type is unclear
      but the product is plainly plain creatine monohydrate powder
    - primaryWeightGrams: total package weight in grams (e.g. 300g tub = 300, 1kg = 1000)
    - All numeric values must be numbers, not strings
    - If no dosing data exists at all, return null for all fields

    Product: %s
    Package weights available: %s
    Description: %s
    """.formatted(productName, weights, trimmed);
    }
}