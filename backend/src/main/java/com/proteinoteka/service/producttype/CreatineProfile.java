package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import com.proteinoteka.util.PackageWeights;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Creatine in every form (powder, capsules, tablets, gummies, sachets, shots). Creatine has no
 * protein content, so none of the protein gates apply; instead an item must not look like another
 * product family, and its form / type / dose / pack size are parsed from the listing text.
 */
@Component
@Slf4j
public class CreatineProfile implements ProductTypeProfile {

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
            | Pattern.UNICODE_CHARACTER_CLASS;

    // Things that show up inside a store's creatine category but are not a creatine product
    // (real examples: "PhD Pre-Workout Burn", "Back to Gym XXL paket", a whey isolate, a multivitamin,
    // BioTech's "Supernova" pre-workout) plus bundles/promos whose price is not the price of the
    // creatine ("2+1 gratis", "1+1 PACK", "LIMITED PACK"). "protein" must be a whole word: the store
    // "Proteini.si" sells its own "100% PURE CREATINE".
    private static final Pattern OTHER_FAMILY = Pattern.compile(
            "\\b(pre-?\\s?work\\s?-?\\s?out|supernova|whey|izolat\\p{L}*|isolate|gainer\\p{L}*|mass\\s?tech|"
                    + "serious\\s?mass|casein|kazein\\p{L}*|protein|bcaa|argi\\p{L}*|"
                    + "amino\\p{L}*|multivit\\p{L}*|vitamin\\p{L}*|omega|glutamin\\p{L}*|citrulin\\p{L}*|"
                    + "carnitin\\p{L}*|karnitin\\p{L}*|beta-?\\s?alanin\\p{L}*|fat\\s?burn\\p{L}*|burn|"
                    + "termogen\\p{L}*|paket\\p{L}*|bundle|combo|set|gratis|poklon\\p{L}*|shaker\\p{L}*|"
                    + "majic\\p{L}*|bars?|limited\\s+pack|\\d\\s?\\+\\s?\\d)\\b", FLAGS);

    // Outside a creatine category the name must actually say creatine (or one of its brand names).
    private static final Pattern CREATINE_KEYWORD = Pattern.compile(
            "kreatin\\p{L}*|creatin\\p{L}*|creapure|kre-?alkalyn|\\bcrea\\b", FLAGS);

    // 20 g is the loading-phase daily total; a per-serving "dose" above it is a serving of a mixed
    // product (creatine + carbohydrates), not creatine (real: Nutrend Creaport parsed as 30 g).
    private static final double MAX_DOSE_GRAMS = 20.0;
    private static final int MAX_COUNT = 1000;

    @Override
    public String code() {
        return ProductTypes.CREATINE;
    }

    @Override
    public Optional<String> rejectReason(Product scraped, boolean categoryTrusted) {
        String name = scraped.getName();
        if (name == null || name.isBlank()) return Optional.of("no name");
        if (OTHER_FAMILY.matcher(name).find()) {
            return Optional.of("name matches another product family or a bundle");
        }
        boolean hasSignal = CREATINE_KEYWORD.matcher(name).find()
                || (scraped.getCreatineGramsPerServing() != null && scraped.getCreatineGramsPerServing() > 0);
        if (!categoryTrusted && !hasSignal) {
            return Optional.of("no creatine keyword or dosing data outside a creatine category");
        }
        return Optional.empty();
    }

    @Override
    public void sanitize(Product scraped, String storeName) {
        CreatineParser.enrich(scraped, scraped.getVariantLabel());
        Double grams = scraped.getCreatineGramsPerServing();
        if (grams != null && (grams <= 0 || grams > MAX_DOSE_GRAMS)) {
            log.warn("[{}] Implausible creatine dose for '{}': {}g — setting null", storeName, scraped.getName(), grams);
            scraped.setCreatineGramsPerServing(null);
        }
        Integer servings = scraped.getServingsPerContainer();
        if (servings != null && (servings < 1 || servings > MAX_COUNT)) {
            scraped.setServingsPerContainer(null);
        }
        Integer units = scraped.getUnitCount();
        if (units != null && (units < 1 || units > MAX_COUNT)) {
            scraped.setUnitCount(null);
        }
        correctSachetPackWeight(scraped);
    }

    // Store scrapers take the first gram figure of a title as the pack weight, but in
    // "CREA PRO (5g Kesica) 20kesica" it is ONE sachet: the pack is sachets × grams (arithmetic on
    // stated figures), and without a stated count the pack weight is unknown, not 5 g. A pack weight
    // stated beside it ("100g (5g kesica)") is never touched.
    private static void correctSachetPackWeight(Product p) {
        Double perSachet = CreatineParser.gramsPerSachet(p.getName());
        if (perSachet == null) return;

        boolean listHoldsOnlyTheSachet = p.getPackage_weight().stream().allMatch(w -> isSachetWeight(PackageWeights.grams(w), perSachet));
        boolean primaryIsTheSachet = p.getPrimaryWeightGrams() == null || isSachetWeight(p.getPrimaryWeightGrams(), perSachet);
        boolean hasAWeight = !p.getPackage_weight().isEmpty() || p.getPrimaryWeightGrams() != null;
        if (!hasAWeight || !listHoldsOnlyTheSachet || !primaryIsTheSachet) return;

        p.getPackage_weight().clear();
        p.setPrimaryWeightGrams(null);
        Integer count = p.getUnitCount();
        if (count != null && count > 1) {
            double total = perSachet * count;
            p.setPrimaryWeightGrams(total);
            p.getPackage_weight().add(total % 1000 == 0 ? (int) (total / 1000) + "kg" : Math.round(total) + "g");
        }
    }

    private static boolean isSachetWeight(Double grams, double perSachet) {
        return grams != null && Math.abs(grams - perSachet) < 0.01;
    }

    // Small creatine tubs start around 700 RSD; anything under this is a single-serving sachet.
    @Override
    public double minPrice(String currency) {
        return "EUR".equals(currency) ? 4.0 : 500.0;
    }

    // Nothing to restore: creatine has no protein data to fall back on, and dose/servings are merged
    // by mergeInto (never overwritten with null).
    @Override
    public boolean restoreFromStored(Product scraped, Optional<Product> stored, String storeName) {
        return true;
    }

    @Override
    public void mergeInto(Product existing, Product scraped) {
        // A listing-only scrape has no description, so the parser can only default to "powder";
        // don't let that overwrite a capsule/tablet form learned earlier.
        if (scraped.getProductForm() != null
                && (existing.getProductForm() == null || !ProductForm.POWDER.code().equals(scraped.getProductForm()))) {
            existing.setProductForm(scraped.getProductForm());
        }
        if (scraped.getUnitCount() != null) existing.setUnitCount(scraped.getUnitCount());
        if (existing.getCreatineGramsPerServing() == null && scraped.getCreatineGramsPerServing() != null)
            existing.setCreatineGramsPerServing(scraped.getCreatineGramsPerServing());
        if (existing.getServingsPerContainer() == null && scraped.getServingsPerContainer() != null)
            existing.setServingsPerContainer(scraped.getServingsPerContainer());
        if (existing.getCreatineType() == null && scraped.getCreatineType() != null)
            existing.setCreatineType(scraped.getCreatineType());
    }

    // The form is always set once the parser has seen a description, so a stored form means the
    // detail page was already parsed. Re-opening it would not change what the regexes find.
    @Override
    public boolean isDetailComplete(Product stored, boolean nutritionInImages) {
        return stored.getProductForm() != null;
    }
}
