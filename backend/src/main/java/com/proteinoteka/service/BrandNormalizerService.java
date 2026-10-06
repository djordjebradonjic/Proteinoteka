package com.proteinoteka.service;

import com.proteinoteka.model.BrandReputation;
import com.proteinoteka.repository.BrandReputationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.xdrop.fuzzywuzzy.FuzzySearch;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrandNormalizerService {

    private final BrandReputationRepository brandReputationRepository;

    private static final int MATCH_THRESHOLD = 80; // 0-100, koliko slično mora biti (token sort on distinguishing words; 75 let "Muscle Labs" become MuscleTech)

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

    /**
     * A known brand written anywhere in a product title ("Creatine Powder – Optimum Nutrition / 88
     * porcija"). The longest whole-word match wins, and the canonical name is returned when the brand
     * has one. Brand names under 3 characters are skipped: aliases such as "BS" would match inside
     * unrelated titles.
     */
    public Optional<String> findKnownBrandIn(String title) {
        if (title == null || title.isBlank()) return Optional.empty();
        BrandReputation best = null;
        for (BrandReputation br : brandReputationRepository.findAll()) {
            String name = br.getBrandName();
            if (name == null || name.length() < 3) continue;
            if (best != null && name.length() <= best.getBrandName().length()) continue;
            Pattern whole = Pattern.compile("(?<![\\p{L}\\p{N}])" + Pattern.quote(name) + "(?![\\p{L}\\p{N}])",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            if (whole.matcher(title).find()) best = br;
        }
        if (best == null) return Optional.empty();
        return Optional.of(best.getCanonicalName() != null ? best.getCanonicalName() : best.getBrandName());
    }

    /**
     * Words that many unrelated brands share. Left in, {@code tokenSetRatio} rates "Mammut Nutrition"
     * against "4+ Nutrition" high enough to rename a brand to another one. They only count when a
     * brand is made of nothing else.
     */
    private static final Set<String> GENERIC_BRAND_WORDS = Set.of(
            "nutrition", "nutritions", "sport", "sports", "labs", "lab", "supplements", "supplement",
            "pharma", "performance", "fitness", "health", "formula", "formulas", "science", "sciences",
            "laboratories", "laboratory", "research", "products", "the", "and");

    /** The brand's distinguishing words ("Mammut Nutrition" → "mammut"); the whole name if all are generic. */
    static String distinctiveBrand(String brand) {
        String lower = brand.toLowerCase().trim();
        StringBuilder sb = new StringBuilder();
        for (String w : lower.split("\\s+")) {
            if (!GENERIC_BRAND_WORDS.contains(w)) sb.append(sb.length() > 0 ? " " : "").append(w);
        }
        return sb.length() > 0 ? sb.toString() : lower;
    }

    /**
     * 0-100 similarity of two brand names, judged on their distinguishing words only. Token SORT, not
     * token set: the set variant scores 100 whenever one name's words are a subset of the other's
     * ("Muscle Labs" vs "Muscle Pharm"). A name that is identical ignoring case beats any fuzzy score
     * (101), so an existing exact brand is never replaced by a different one that scores 100 too.
     */
    static int similarity(String a, String b) {
        if (a.trim().equalsIgnoreCase(b.trim())) return 101;
        return FuzzySearch.tokenSortRatio(distinctiveBrand(a), distinctiveBrand(b));
    }

    public String normalize(String rawBrand) {
        if (rawBrand == null || rawBrand.isBlank()) return rawBrand;

        String cleaned = clean(rawBrand);

        List<BrandReputation> allBrands = brandReputationRepository.findAll();

        // Traži najbolji match
        BrandReputation bestMatch = null;
        int bestScore = 0;

        for (BrandReputation br : allBrands) {
            int score = similarity(cleaned, br.getBrandName());
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