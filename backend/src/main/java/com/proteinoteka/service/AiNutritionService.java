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
        if (description == null || description.isBlank()) return null;

        try {
            String prompt = buildPrompt(productName, description, packageWeights);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "claude-haiku-4-5");
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
        String trimmed = description.length() > 800
                ? description.substring(0, 800)
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
              "proteinSource": <"whey_concentrate"|"whey_isolate"|"hydrolysate"|"vegan"|"casein"|"blend"|null>,
              "primaryWeightGrams": <total package weight in grams as number or null>
            }
                        
            Rules:
            - proteinPer100g: grams of protein per 100g of product
            - primaryWeightGrams: convert kg to grams (e.g. 2kg = 2000)
            - proteinSource: best match from the allowed values only
            - All values must be numbers, not strings
                        
            Product: %s
            Package weights available: %s
            Description: %s
            """.formatted(productName, weights, trimmed);
    }
}