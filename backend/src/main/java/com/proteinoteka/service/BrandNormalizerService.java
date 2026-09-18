package com.proteinoteka.service;

import com.proteinoteka.model.BrandReputation;
import com.proteinoteka.repository.BrandReputationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.xdrop.fuzzywuzzy.FuzzySearch;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrandNormalizerService {

    private final BrandReputationRepository brandReputationRepository;

    private static final int MATCH_THRESHOLD = 75; // 0-100, koliko slično mora biti

    /**
     * Strips a numbered-list prefix ("96.Scitec Nutrition" → "Scitec Nutrition") and ®/™.
     * The dot is required: the old pattern made it optional and turned "5Star" / "5 Stars"
     * into "Star" / "Stars", which then failed to match the "5 Stars" brand.
     */
    static String clean(String rawBrand) {
        return rawBrand
                .replaceAll("^\\d+\\.\\s*", "")
                .replaceAll("[®™]", "")
                .trim();
    }

    public String normalize(String rawBrand) {
        if (rawBrand == null || rawBrand.isBlank()) return rawBrand;

        String cleaned = clean(rawBrand);

        List<BrandReputation> allBrands = brandReputationRepository.findAll();

        // Traži najbolji match
        BrandReputation bestMatch = null;
        int bestScore = 0;

        for (BrandReputation br : allBrands) {
            int score = FuzzySearch.tokenSetRatio(
                    cleaned.toLowerCase(),
                    br.getBrandName().toLowerCase()
            );
            if (score > bestScore) {
                bestScore = score;
                bestMatch = br;
            }
        }

        if (bestMatch != null && bestScore >= MATCH_THRESHOLD) {
            String resolved = bestMatch.getCanonicalName() != null
                    ? bestMatch.getCanonicalName()
                    : bestMatch.getBrandName();
            log.info("Brand normalized: '{}' → '{}' (score: {})", rawBrand, resolved, bestScore);
            return resolved;
        }

        // Nije nađen match — vrati očišćeni original
        log.info("Brand not matched: '{}' (best score: {}), keeping as: '{}'",
                rawBrand, bestScore, cleaned);
        return cleaned;
    }
}