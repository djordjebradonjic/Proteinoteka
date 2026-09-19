package com.proteinoteka.service;

import com.proteinoteka.dto.ValueScoreBreakdown;
import com.proteinoteka.model.Product;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Pure (Spring-free) value-score computation, so every caller — scraper, admin recalculation,
 * product detail breakdown, data-quality audit — gets the exact same number and the rules can be
 * unit-tested in isolation.
 *
 * <p>A score is only produced for products that can be fairly compared as a protein powder with
 * trustworthy inputs. Everything else gets {@code null} plus a {@link SkipReason}, because a
 * confident-looking but wrong score (e.g. a mass gainer scraped as 87% protein ranking in the top
 * 5% "best value") is worse than no score.
 */
@Slf4j
public final class ValueScoreCalculator {

    private ValueScoreCalculator() {}

    public static final double DEFAULT_BRAND_SCORE = 4.5;

    /**
     * Price per gram of protein below this fraction of the category benchmark is not a bargain,
     * it is a scraping error (wrong weight, single-serving price, wrong variant). The cheapest
     * legitimate products observed sit at ~0.35x the benchmark.
     */
    static final double MIN_PRICE_RATIO_OF_BENCHMARK = 0.25;

    /** Above this protein content a powder is physically implausible (a parse of "100%" etc.). */
    static final double MAX_PLAUSIBLE_PROTEIN = 95.0;

    /** Below this a product is a bar / meal replacement / gainer, not a protein powder. */
    static final double MIN_POWDER_PROTEIN = 40.0;

    /** Soft "meal-replacement" wording only disqualifies when protein is also low. */
    static final double SOFT_KEYWORD_PROTEIN_CEILING = 55.0;

    /** Isolates / hydrolysates are >= ~70% protein by definition; less means a wrong parse. */
    static final double MIN_ISOLATE_PROTEIN = 65.0;

    /**
     * The weight written in the product name may differ from primaryWeightGrams by at most this
     * much before the row is considered unreliable (price/g protein would be wrong by the same %).
     */
    static final double WEIGHT_CONFLICT_TOLERANCE = 0.20;

    /** Multiplier when beef/collagen is only one ingredient of a blend (not the protein source). */
    static final double BEEF_INGREDIENT_MULTIPLIER = 0.93;

    /** Multiplier when beef/collagen IS the protein source — nutritionally incomplete (no tryptophan). */
    static final double BEEF_PRIMARY_MULTIPLIER = 0.72;

    public enum SkipReason {
        /** Missing price / protein / weight. */
        MISSING_DATA,
        /** Bar, meal replacement, mass gainer, or protein content far too low for a protein powder. */
        NOT_PROTEIN_POWDER,
        /** Protein % contradicts the declared protein type (e.g. "isolate" with 30% protein) or is >95%. */
        IMPLAUSIBLE_PROTEIN,
        /** Price per gram of protein is outside any believable range for the category. */
        IMPLAUSIBLE_PRICE,
        /** Weight in the product name contradicts the stored weight, so price per gram is unreliable. */
        CONFLICTING_WEIGHT
    }

    public enum BeefContent { NONE, INGREDIENT, PRIMARY }

    public record Evaluation(ValueScoreBreakdown breakdown, SkipReason skipReason) {
        public boolean scored() { return breakdown != null; }
    }

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
            | Pattern.UNICODE_CHARACTER_CLASS;

    // ---------------------------------------------------------------- non-powder detection

    private static final Pattern HARD_NON_POWDER_NAME = Pattern.compile(
            "\\b(bars?|baton\\w*|gainers?|hypermass|masster|mass|snack\\w*)\\b"
                    + "|muscle\\s+juice"
                    + "|zamen\\w*\\s+(za\\s+)?obrok|zamjen\\w*\\s+(za\\s+)?obrok"
                    + "|zamenski|zamjenski|meal\\s+replacement|meal\\s+shake|diet\\s+fuel|smoothie",
            FLAGS);

    private static final Pattern SOFT_NON_POWDER_NAME = Pattern.compile(
            "\\b(shake|breakfast|fuel|meal|diet|low-?cal|replacement|obrok|complete|one\\s+stop)\\b",
            FLAGS);

    private static final Set<String> PURE_PROTEIN_SOURCES = Set.of(
            "whey_isolate", "whey_concentrate", "hydrolysate", "casein", "egg");

    // ---------------------------------------------------------------- beef / collagen detection

    // Leading "(?<!\p{L})" is essential: without it "gov" matches inside "nje-gov-ih proteina",
    // "nje-gov proteinski" or "od-gov-ara proteinski" and wrongly flags plain whey/casein/vegan.
    private static final Pattern BEEF_IN_NAME = Pattern.compile(
            "beef|collagen|hovezi|(?<!\\p{L})gove[đd]\\p{L}*", FLAGS);

    private static final Pattern BEEF_IN_DESCRIPTION = Pattern.compile(
            "beef|hovezi|collagen|(?<!\\p{L})gove[đd]\\p{L}*\\s+"
                    + "(protein\\p{L}*|kolagen\\p{L}*|bjelančevin\\p{L}*|belančevin\\p{L}*)",
            FLAGS);

    private static final Map<String, Double> SUGAR_MEDIAN_BY_SOURCE = Map.of(
            "whey_concentrate", 6.3,
            "blend", 4.4,
            "whey_isolate", 1.0,
            "hydrolysate", 3.0,
            "casein", 3.0,
            "vegan", 0.2
    );

    // ---------------------------------------------------------------- public API

    public static Double score(Double numericPrice, Product p, double brandScore) {
        ValueScoreBreakdown b = evaluate(numericPrice, p, brandScore).breakdown();
        return b == null ? null : b.total();
    }

    public static ValueScoreBreakdown breakdown(Double numericPrice, Product p, double brandScore) {
        return evaluate(numericPrice, p, brandScore).breakdown();
    }

    public static Evaluation evaluate(Double numericPrice, Product p, double brandScore) {
        if ("creatine".equals(p.getProductType())) {
            return evaluateCreatine(numericPrice, p, brandScore);
        }

        if (numericPrice == null || numericPrice <= 0 || p.getProteinPer100g() == null) {
            return skip(SkipReason.MISSING_DATA);
        }
        double packageGrams = extractPackageGrams(p);
        if (packageGrams <= 0) return skip(SkipReason.MISSING_DATA);

        if (weightNameMismatch(p, WEIGHT_CONFLICT_TOLERANCE) != null) return skip(SkipReason.CONFLICTING_WEIGHT);

        double proteinPct = p.getProteinPer100g();
        String source = effectiveSource(p);

        SkipReason ineligible = eligibility(p.getName(), proteinPct, source);
        if (ineligible != null) return skip(ineligible);

        double proteinTotalGrams = (proteinPct / 100.0) * packageGrams;
        if (proteinTotalGrams <= 0) return skip(SkipReason.MISSING_DATA);
        double pricePerGramProtein = numericPrice / proteinTotalGrams;
        boolean eur = "EUR".equals(p.getCurrency());
        double maxPricePerGram = eur ? 0.50 : 50.0;
        double rawBenchmark = benchmark(source, p.getCurrency());
        if (pricePerGramProtein > maxPricePerGram
                || pricePerGramProtein < rawBenchmark * MIN_PRICE_RATIO_OF_BENCHMARK) {
            return skip(SkipReason.IMPLAUSIBLE_PRICE);
        }

        BeefContent beef = beefContent(p);
        boolean beefPrimary = beef == BeefContent.PRIMARY;

        // 1. VALUE FOR MONEY (0-10) - weight 0.35
        double benchmark = rawBenchmark;
        // Trusted brands justify a price premium — shift the benchmark up so they aren't penalized
        // for costing more than no-name locals (9.5 brand = 25% tolerance, 7.0+ = 12%)
        if (brandScore >= 8.0)      benchmark *= 1.25;
        else if (brandScore >= 7.0) benchmark *= 1.12;
        double ratio = pricePerGramProtein / benchmark;

        double valueMoney = 10.0 / (1.0 + Math.exp(3.5 * (ratio - 1.2)));
        valueMoney = Math.max(0, Math.min(10, valueMoney));

        // 2. PROTEIN PURITY (0-10) - weight 0.20
        double proteinPurity = 10 * Math.pow(Math.max(0, (proteinPct - 60) / 40.0), 0.7);
        // Beef/collagen protein has high nitrogen content but poor essential AA profile —
        // the measured protein % overstates the effective quality. Apply a 50% purity penalty.
        if (beefPrimary) proteinPurity *= 0.50;
        proteinPurity = Math.max(0, Math.min(10, proteinPurity));

        // 3. DIGESTIBILITY (0-10) - weight 0.15
        double digestibility = 7.0;
        if (beefPrimary) {
            // Collagen is missing tryptophan — DIAAS ≈ 0 for muscle protein synthesis purposes
            digestibility = 4.5;
        } else if (source != null) {
            if (source.contains("hydro"))           digestibility = 10.0;
            else if (source.contains("cfm"))        digestibility = 9.7;
            else if (source.contains("isolat"))     digestibility = 9.3;
            else if (source.contains("casein"))     digestibility = 8.0;
            else if (source.contains("concentrat")) digestibility = 7.5;
            else if (source.contains("vegan"))      digestibility = 6.5;
            if (source.contains("lactose"))         digestibility = Math.min(10, digestibility + 0.3);
        }

        // 4. INGREDIENTS (0-10) - weight 0.15
        // Sugar: use measured value when available; otherwise impute from category median.
        double ingredients = 10.0;
        boolean sugarImputed = false;
        double effectiveSugar;
        if (p.getSugarPer100g() != null) {
            effectiveSugar = p.getSugarPer100g();
        } else {
            effectiveSugar = SUGAR_MEDIAN_BY_SOURCE.getOrDefault(source == null ? "" : source, 4.0);
            sugarImputed = true;
        }
        if (effectiveSugar > 10)     ingredients -= 3.0;
        else if (effectiveSugar > 5) ingredients -= 1.5;

        if (p.getDescription() != null) {
            String desc = p.getDescription().toLowerCase();
            if (desc.contains("aspartam") || desc.contains("acesulfam"))
                ingredients -= 1.5;
            if (desc.contains("artificial") || desc.contains("color")  ||
                    desc.contains("emulsifier") || desc.contains("boja")   ||
                    desc.contains("emulgator")  || desc.contains("aroma"))
                ingredients -= 1.0;
        }
        ingredients = Math.max(0, ingredients);

        // Penal: skupo + nepoznat brend
        if (brandScore < 6.0 && ratio > 1.2) {
            valueMoney *= 0.85;
        }

        // 6. CONFIDENCE PENALTY
        // Imputed sugar counts as half-missing (we estimated, not measured).
        double missingWeight = 0;
        if (sugarImputed)                                               missingWeight += 0.5;
        if (p.getFatPer100g() == null)                                  missingWeight += 1;
        if (p.getDescription() == null || p.getDescription().isBlank()) missingWeight += 1;
        if (p.getProteinSource() == null)                               missingWeight += 1;
        double confidencePenalty = Math.max(0.84, 1.0 - (missingWeight * 0.04));

        // FINAL SCORE
        // Brand weight raised to 15% (from 10%) to prevent unknown cheap brands from
        // outranking established, tested brands purely on price.
        double total =
                (0.35 * valueMoney)    +
                        (0.20 * proteinPurity) +
                        (0.15 * digestibility) +
                        (0.15 * ingredients)   +
                        (0.15 * brandScore);

        total *= confidencePenalty;

        // Beef/collagen as the protein source is nutritionally incomplete — heavy multiplier so it
        // scores below quality whey even when cheap. As a minor ingredient of an otherwise
        // whey/casein/plant product it only earns a small deduction.
        if (beefPrimary) total *= BEEF_PRIMARY_MULTIPLIER;
        else if (beef == BeefContent.INGREDIENT) total *= BEEF_INGREDIENT_MULTIPLIER;

        return new Evaluation(new ValueScoreBreakdown(
                round1(valueMoney),
                round1(proteinPurity),
                round1(digestibility),
                round1(ingredients),
                beef != BeefContent.NONE,
                round1(total)
        ), null);
    }

    /**
     * Why this (protein-type) product can't be fairly scored, or {@code null} when it can.
     * Only inspects name / protein % / source; price plausibility is checked separately.
     */
    static SkipReason eligibility(String name, double proteinPct, String source) {
        if (proteinPct > MAX_PLAUSIBLE_PROTEIN) return SkipReason.IMPLAUSIBLE_PROTEIN;

        String n = name == null ? "" : name;
        if (HARD_NON_POWDER_NAME.matcher(n).find()) return SkipReason.NOT_PROTEIN_POWDER;

        boolean pureSource = source != null && PURE_PROTEIN_SOURCES.contains(source);
        if (proteinPct < MIN_POWDER_PROTEIN) {
            // A "whey isolate" with 30% protein is a bad parse; a "blend"/"vegan"/untyped product
            // with 30% is a meal replacement.
            return pureSource ? SkipReason.IMPLAUSIBLE_PROTEIN : SkipReason.NOT_PROTEIN_POWDER;
        }
        if (proteinPct < SOFT_KEYWORD_PROTEIN_CEILING && SOFT_NON_POWDER_NAME.matcher(n).find()) {
            return SkipReason.NOT_PROTEIN_POWDER;
        }
        if (("whey_isolate".equals(source) || "hydrolysate".equals(source))
                && proteinPct < MIN_ISOLATE_PROTEIN) {
            return SkipReason.IMPLAUSIBLE_PROTEIN;
        }
        return null;
    }

    public static boolean isNonPowderName(String name) {
        return name != null && HARD_NON_POWDER_NAME.matcher(name).find();
    }

    /**
     * The scraped/AI protein-type label is sometimes wrong for hydrolysates ("Amino Whey Hydro"
     * or "100% Hydro Isolate" labelled concentrate/isolate). An explicit "hydro" in the name wins
     * over a whey/blend/unknown label (but not over casein/vegan/beef, e.g. "HydroX Micellar Casein").
     */
    public static String effectiveSource(Product p) {
        String src = p.getProteinSource() == null ? null : p.getProteinSource().toLowerCase();
        String name = p.getName() == null ? "" : p.getName().toLowerCase();
        boolean nameSaysHydro = name.contains("hydro") || name.contains("hidro");
        boolean overridable = src == null || src.contains("whey") || src.contains("blend")
                || src.contains("isolat") || src.contains("concentrat");
        if (nameSaysHydro && overridable && !BEEF_IN_NAME.matcher(name).find()) return "hydrolysate";
        return src;
    }

    public static BeefContent beefContent(Product p) {
        if (nameOrSourceMentionsBeef(p)) return BeefContent.PRIMARY;
        if (mentionsBeefIngredient(p.getAiDescription()) || mentionsBeefIngredient(p.getDescription())) {
            return BeefContent.INGREDIENT;
        }
        return BeefContent.NONE;
    }

    private static boolean nameOrSourceMentionsBeef(Product p) {
        return (p.getName() != null && BEEF_IN_NAME.matcher(p.getName()).find())
                || (p.getProteinSource() != null && BEEF_IN_NAME.matcher(p.getProteinSource()).find());
    }

    // Free-text descriptions mention "goveđ*" (bovine) in harmless contexts too — e.g. "goveđe
    // mleko" (cow's milk, the normal source of any whey/casein product) or "goveđi serumski
    // albumin" (a naturally occurring minor whey fraction) — which must NOT trigger any beef
    // penalty. Only a "goveđ*" mention directly adjacent to "protein"/"kolagen"/"belančevin(e)"
    // denotes an actual added beef-protein ingredient.
    private static boolean mentionsBeefIngredient(String text) {
        return text != null && BEEF_IN_DESCRIPTION.matcher(text).find();
    }

    /** Category price benchmark: RSD (or EUR) per gram of protein for a "fair" price. */
    public static double benchmark(String proteinSource, String currency) {
        String src = proteinSource == null ? null : proteinSource.toLowerCase();
        if ("EUR".equals(currency)) {
            // Calibrated to cleaned HR market medians x~1.06 (powders only, 60-95% protein):
            // hydro=0.065, cfm/iso=0.070, casein=0.054, vegan=0.047, blend=0.061, conc=0.061, beef=0.045
            if (src == null)                return 0.065;
            if (src.contains("hydro"))      return 0.069;
            if (src.contains("cfm"))        return 0.075;
            if (src.contains("isolat"))     return 0.075;
            if (src.contains("casein"))     return 0.057;
            if (src.contains("vegan"))      return 0.050;
            if (src.contains("blend"))      return 0.065;
            if (src.contains("concentrat")) return 0.065;
            if (src.contains("egg"))        return 0.065;
            if (src.contains("beef"))       return 0.048;
            return 0.065;
        }
        // Calibrated to cleaned RS market medians (powders only, 60-95% protein):
        // hydro=5.76, iso=6.74, casein=5.44, vegan=5.37, blend=5.01, conc=5.82, beef=4.66
        if (src == null)                return 5.5;
        if (src.contains("hydro"))      return 6.1;
        if (src.contains("cfm"))        return 7.5;
        if (src.contains("isolat"))     return 7.5;
        if (src.contains("casein"))     return 5.5;
        if (src.contains("vegan"))      return 5.8;
        if (src.contains("blend"))      return 5.3;
        if (src.contains("concentrat")) return 5.5;
        if (src.contains("egg"))        return 9.5;
        if (src.contains("beef"))       return 4.9;
        return 5.5;
    }

    public static double extractPackageGrams(Product p) {
        if (p.getPrimaryWeightGrams() != null && p.getPrimaryWeightGrams() > 0) {
            return p.getPrimaryWeightGrams();
        }
        boolean isEmpty;
        try {
            isEmpty = p.getPackage_weight() == null || p.getPackage_weight().isEmpty();
        } catch (org.hibernate.LazyInitializationException e) {
            return 0;
        }
        if (isEmpty) return 0;

        for (String raw : p.getPackage_weight()) {
            String weight = raw.toLowerCase().replaceAll("\\s+", "");
            try {
                if (weight.contains("kg")) {
                    double val = Double.parseDouble(weight.replace("kg", "").replace(",", ".")) * 1000;
                    if (val > 0) return val;
                } else if (weight.contains("g")) {
                    double val = Double.parseDouble(weight.replace("g", "").replace(",", "."));
                    if (val > 0) return val;
                }
            } catch (Exception ignored) {}
        }

        log.warn("Cannot parse any package weight from: '{}'", p.getPackage_weight());
        return 0;
    }

    // ---------------------------------------------------------------- weight in name

    private static final Pattern NAME_WEIGHT = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*(kg|gr|g)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern MULTIPACK = Pattern.compile("\\d+\\s*x\\s*\\d", Pattern.CASE_INSENSITIVE);

    /**
     * Non-null (a human-readable description) when the weight(s) written in the name match nothing
     * near primaryWeightGrams. Multipacks ("12x60g") are ignored, as are values under 50 g
     * (per-serving numbers or "2,3g" kg typos). Any one matching weight is enough, so bundles
     * like "Whey 2.27kg / Citrulline 400g" pass.
     */
    public static String weightNameMismatch(Product p, double tolerance) {
        Double primary = p.getPrimaryWeightGrams();
        String name = p.getName();
        if (primary == null || primary <= 0 || name == null || MULTIPACK.matcher(name).find()) return null;

        java.util.List<Double> named = new java.util.ArrayList<>();
        java.util.regex.Matcher m = NAME_WEIGHT.matcher(name);
        while (m.find()) {
            double v = Double.parseDouble(m.group(1).replace(',', '.'));
            if (m.group(2).equalsIgnoreCase("kg")) v *= 1000;
            if (v >= 50) named.add(v);
        }
        if (named.isEmpty()) return null;
        if (named.stream().anyMatch(v -> Math.abs(v - primary) / v <= tolerance)) return null;
        return String.format(java.util.Locale.ROOT, "name says %s g but primaryWeightGrams=%.0f g",
                named.stream().map(v -> String.valueOf(Math.round(v))).collect(java.util.stream.Collectors.joining("/")),
                primary);
    }

    // ---------------------------------------------------------------- creatine

    // Creatine monohydrate is a near-commodity ingredient (no digestibility/purity spread like
    // whey sources have), so unlike the protein formula this is just a single price-per-gram-of-
    // product score.
    //
    // The benchmark is the market median price per gram of pack for powders, measured 2026-09-19 from
    // live store listings: RS 9.95 RSD/g (17 rows, 2 stores; quartiles 7.98-11.96), HR 0.083 EUR/g
    // (20 rows, 2 stores; quartiles 0.063-0.094). The two markets agree (0.083 EUR is ~9.75 RSD).
    // The first estimate (2 RSD/g) was five times too low and scored every real listing near zero.
    // Two stores per market is a thin base: re-derive from the wider catalogue with the audit's median
    // report once more stores carry creatine, then run recalculate-scores.
    private static final double CREATINE_BENCHMARK_RSD_PER_G = 10.0;
    private static final double CREATINE_BENCHMARK_EUR_PER_G = 0.085;
    // Above this a listing is a data error or not creatine at all (highest real one: a 29 RSD/g GAA blend).
    private static final double CREATINE_MAX_TO_BENCHMARK = 4.0;
    // Below this it is not (only) creatine: carbohydrate mixes sold under a creatine name (Nutrend Creaport,
    // Amix VitarGO + Kre-Alkalyn) cost 0.26-0.31x the median per gram and would otherwise top the ranking,
    // while the cheapest real powders measured 0.55x. Same idea as the protein price floor.
    private static final double CREATINE_MIN_TO_BENCHMARK = 0.35;

    private static Evaluation evaluateCreatine(Double numericPrice, Product p, double brandScore) {
        if (numericPrice == null || numericPrice <= 0) return skip(SkipReason.MISSING_DATA);
        double packageGrams = extractPackageGrams(p);
        if (packageGrams <= 0) return skip(SkipReason.MISSING_DATA);

        boolean eur = "EUR".equals(p.getCurrency());
        double pricePerGram = numericPrice / packageGrams;
        double marketBenchmark = eur ? CREATINE_BENCHMARK_EUR_PER_G : CREATINE_BENCHMARK_RSD_PER_G;
        if (pricePerGram > marketBenchmark * CREATINE_MAX_TO_BENCHMARK
                || pricePerGram < marketBenchmark * CREATINE_MIN_TO_BENCHMARK) {
            return skip(SkipReason.IMPLAUSIBLE_PRICE);
        }

        double benchmark = marketBenchmark;
        if (brandScore >= 8.0)      benchmark *= 1.25;
        else if (brandScore >= 7.0) benchmark *= 1.12;

        double ratio = pricePerGram / benchmark;
        double score = 10.0 / (1.0 + Math.exp(3.5 * (ratio - 1.2)));
        score = Math.max(0, Math.min(10, score));
        // Creatine is a near-commodity with no purity/digestibility/ingredient spread — the
        // total score IS the value-for-money score.
        return new Evaluation(new ValueScoreBreakdown(score, 10.0, 10.0, 10.0, false, score), null);
    }

    private static Evaluation skip(SkipReason reason) {
        return new Evaluation(null, reason);
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
