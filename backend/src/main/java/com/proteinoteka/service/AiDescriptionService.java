package com.proteinoteka.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class AiDescriptionService {

    @Value("${anthropic.api.key}")
    private String apiKey;

    private final ProductRepository productRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean enrichProduct(Product product) {
        try {
            String prompt = buildPrompt(product);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "claude-haiku-4-5-20251001");
            requestBody.put("max_tokens", 600);
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
                log.error("Anthropic API error for '{}': {} {}", product.getName(), response.statusCode(), response.body());
                return false;
            }

            JsonNode root = objectMapper.readTree(response.body());
            String text = root.path("content").get(0).path("text").asText().trim();

            product.setAiDescription(text);
            productRepository.save(product);
            log.info("✅ {} — ai description generated", product.getName());
            return true;

        } catch (Exception e) {
            log.error("AI description failed for '{}': {}", product.getName(), e.getMessage());
            return false;
        }
    }

    private String buildPrompt(Product product) {
        String desc = product.getDescription();
        if (desc != null && desc.length() > 1000) {
            desc = desc.substring(0, 1000);
        }

        String weightStr = product.getPrimaryWeightGrams() != null
                ? String.valueOf(product.getPrimaryWeightGrams().intValue())
                : "N/A";

        return """
Ti si SEO ekspert za srpsko tržište suplementacije.

Napiši opis proizvoda za protein suplement na srpskom jeziku (latinica).

Pravila:
- Dužina: 120-150 reči
- Ton: informativan, poverljiv, ne reklamni
- Bez superlativa ("najbolji", "vrhunski", "jedinstven")
- Samo prirodan tekst — bez tabela, bez bullet points, bez sekcija kao "Nutritivne vrednosti:", bez formatiranja
- Nutritivne vrednosti pomeni prirodno u rečenici ako postoje, primer: "Sa 74g proteina na 100g, ovaj whey..." NE ovako: "Protein: 74g, Masti: 4g"
- Pomeni: tip proteina, procenat proteina ako postoji, težinu pakovanja, za koga je idealan (masa/mršavljenje/oporavak)
- Prirodno uključi ključne reči: ime brenda, whey protein, cena, Srbija — bez spama
- Poslednja rečenica mora biti tačno: "Uporedi cene i pronađi najbolju ponudu na Proteinoteka.rs."
- NE kopiraj originalni opis — napiši potpuno nov tekst
- NE izmišljaj nutritivne vrednosti — koristi samo date podatke
- Ako nutritivni podaci nisu dostupni, napiši opis bez njih

Podaci o proizvodu:
Naziv: %s
Brend: %s
Kategorija: %s
Protein na 100g: %sg
Masti na 100g: %sg
Šećer na 100g: %sg
Kalorije na 100g: %skcal
Težina pakovanja: %sg
Originalni opis (za kontekst, NE kopiraj): %s
""".formatted(
                nvl(product.getName()),
                nvl(product.getBrand()),
                nvl(product.getProteinSource()),
                nvl(product.getProteinPer100g()),
                nvl(product.getFatPer100g()),
                nvl(product.getSugarPer100g()),
                nvl(product.getCaloriePer100g()),
                weightStr,
                desc != null ? desc : "N/A"
        );
    }

    private String nvl(Object value) {
        return value != null ? String.valueOf(value) : "N/A";
    }
}
