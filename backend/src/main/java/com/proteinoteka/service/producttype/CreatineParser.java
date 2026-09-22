package com.proteinoteka.service.producttype;

import com.proteinoteka.model.Product;
import com.proteinoteka.util.PackageWeights;
import org.jsoup.Jsoup;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure (Spring-free) extraction of creatine attributes from a product name and description
 * (Serbian, Croatian and English wording). Regexes only, and no guessing: anything the text does
 * not state stays {@code null} — a wrong dose or pack size is worse than a missing one, because
 * price-per-gram comparisons and product grouping are built on these values.
 *
 * <p>Name is the primary source for form, type, pack weight and unit count (a store's listing
 * title is what tells one SKU from another); the description is only used for the dose per
 * serving and, as a fallback, the number of servings.
 */
public final class CreatineParser {

    private CreatineParser() {}

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
            | Pattern.UNICODE_CHARACTER_CLASS;

    /** Everything extractable from one product. Every field but {@code form} may be null. */
    public record Info(ProductForm form, String type, Double packageGrams, Double gramsPerServing,
                       Integer servings, Integer unitCount) {}

    // ---------------------------------------------------------------- form

    // The unit word may be glued to its count ("150cap", "120kap", "90tb", "20kesica"), and there is no
    // \b between a digit and a letter, so the edges are "not next to another letter" instead. That also
    // keeps "Captain" and "Table" from reading as capsules/tablets.
    private static final String UNIT_START = "(?<!\\p{L})";
    private static final String UNIT_END = "(?!\\p{L})";

    private static final String CAPSULE_WORDS = "kapsul\\p{L}*|capsul\\p{L}*|caps?|kaps?";
    private static final String TABLET_WORDS = "tablet\\p{L}*|tabl?s?|tbl|tb";
    private static final String GUMMY_WORDS = "gumen\\p{L}*|gumm\\p{L}*|bombon\\p{L}*";
    private static final String SACHET_WORDS = "kesic\\p{L}*|sachets?|sticks?";

    private static final Pattern CAPSULE = Pattern.compile(UNIT_START + "(" + CAPSULE_WORDS + ")" + UNIT_END, FLAGS);
    private static final Pattern TABLET = Pattern.compile(UNIT_START + "(" + TABLET_WORDS + ")" + UNIT_END, FLAGS);
    private static final Pattern GUMMY = Pattern.compile(UNIT_START + "(" + GUMMY_WORDS + ")" + UNIT_END, FLAGS);
    // A sachet pack is still a powder; it is checked before LIQUID so "Crea Shot, 20 kesica" stays a powder.
    private static final Pattern SACHET = Pattern.compile(UNIT_START + "(" + SACHET_WORDS + ")" + UNIT_END, FLAGS);
    private static final Pattern LIQUID = Pattern.compile(
            UNIT_START + "(shots?|liquid|te[cč]n\\p{L}*|ampul\\p{L}*)" + UNIT_END, FLAGS);

    // "120 kapsula", "150cap", "90 tableta", "60tb", "60 gumenih bombona", "30 kesica"
    private static final Pattern UNITS = Pattern.compile(
            "(?<![\\d.,])(\\d{1,4})\\s*(" + CAPSULE_WORDS + "|" + TABLET_WORDS + "|" + GUMMY_WORDS
                    + "|" + SACHET_WORDS + ")" + UNIT_END, FLAGS);

    /** A pack of at least this many pieces described only in the text is strong evidence of the form. */
    private static final int DESCRIPTION_MIN_UNITS = 30;

    // "5g Kesica", "3,5 g sachets": the weight of ONE sachet, as opposed to the count ("20 kesica")
    private static final Pattern SACHET_WEIGHT = Pattern.compile(
            "(?<![\\d.,])(\\d+[.,]?\\d*)\\s*(?:g|gr|grama?)\\s*(?:" + SACHET_WORDS + ")" + UNIT_END, FLAGS);

    // ---------------------------------------------------------------- type

    private static final Pattern CREAPURE = Pattern.compile("\\bcreapure", FLAGS);
    private static final Pattern MONOHYDRATE = Pattern.compile(
            "monohidrat\\p{L}*|monohydrat\\p{L}*|micronized|micronised|mikroniz\\p{L}*", FLAGS);
    private static final Pattern HCL = Pattern.compile("\\bhcl\\b|hidroklorid\\p{L}*|hydrochlorid\\p{L}*", FLAGS);
    private static final Pattern BUFFERED = Pattern.compile(
            "kre-?alkalyn|alkalyn|alkalin\\p{L}*|buffered|puferovan\\p{L}*", FLAGS);
    private static final Pattern MALATE = Pattern.compile("\\bmalat\\p{L}*|\\bmalate\\b|\\btcm\\b", FLAGS);
    private static final Pattern ETHYL_ESTER = Pattern.compile("ethyl\\s*ester|etil\\s*est\\p{L}*|\\bcee\\b", FLAGS);
    private static final Pattern NITRATE = Pattern.compile("\\bnitrat\\p{L}*", FLAGS);
    private static final Pattern BLEND_WORD = Pattern.compile(
            "\\b(blend|mix|mje[sš]avin\\p{L}*|me[sš]avin\\p{L}*|kompleks\\p{L}*|complex|matrix|stack)\\b", FLAGS);

    // ---------------------------------------------------------------- sizes and doses

    private static final Pattern SERVINGS = Pattern.compile(
            "(?<![\\d.,])(\\d{1,4})\\s*(porcij\\p{L}*|doz\\p{L}*|serviranj\\p{L}*|servings?)(?!\\p{L})", FLAGS);
    // "60 i 100 porcija", "60, odnosno 100 porcija": several pack sizes in one text — no single answer
    // without knowing which variant is meant.
    private static final Pattern SERVINGS_MULTI = Pattern.compile(
            "(?<![\\d.,])\\d{1,4}\\s*(?:,\\s*)?(?:i|and|ili|or|odnosno|respectively|/|,|-)\\s*\\d{1,4}\\s*"
                    + "(?:porcij|doz|serviranj|servings?)", FLAGS);
    // "60 doza po pakovanju", "100 servings per container"
    private static final Pattern SERVINGS_PER_PACK = Pattern.compile(
            "(?<![\\d.,])(\\d{1,4})\\s*(?:porcij\\p{L}*|doz\\p{L}*|serviranj\\p{L}*|servings?)\\s*"
                    + "(?:po\\s+pakovanj\\p{L}*|u\\s+pakovanj\\p{L}*|per\\s+container|per\\s+pack\\p{L}*)", FLAGS);
    // "Broj doza: 60", "Number of servings: 60"
    private static final Pattern SERVINGS_LABELLED = Pattern.compile(
            "(?:broj\\s+(?:porcij\\p{L}*|doz\\p{L}*)|number\\s+of\\s+servings|servings?\\s+per\\s+container)"
                    + "\\s*[:=]?\\s*(\\d{1,4})", FLAGS);

    // "5 g po porciji", "3g kreatina po dozi"
    private static final Pattern DOSE_BEFORE_UNIT = Pattern.compile(
            "(\\d+[.,]?\\d*)\\s*(?:g|gr|grama?|grams?)\\b[^.\\n]{0,40}?"
                    + "(?:po\\s+(?:porcij\\p{L}*|doz\\p{L}*|serviranj\\p{L}*|meric\\p{L}*|mjeric\\p{L}*)|per\\s+serving)",
            FLAGS);
    // "Porcija: 5 g", "1 doza (5g)", "serving size 3 g", "1 mjerica = 5 g"
    private static final Pattern DOSE_AFTER_UNIT = Pattern.compile(
            "(?:porcij\\p{L}*|doz\\p{L}*|serviranj\\p{L}*|serving(?:\\s+size)?|meric\\p{L}*|mjeric\\p{L}*|scoop)"
                    + "[^0-9]{0,25}?(\\d+[.,]?\\d*)\\s*(?:g|gr|grama?|grams?)\\b", FLAGS);
    // "5000 mg kreatina", "creatine monohydrate 3000mg"
    private static final Pattern DOSE_MG = Pattern.compile(
            "(\\d{3,5})\\s*mg\\s*(?:\\p{L}+\\s+){0,2}(?:kreatin|creatine)", FLAGS);

    private static final double MAX_DOSE_GRAMS = 30.0;
    private static final int MIN_SERVINGS = 5;
    private static final int MAX_SERVINGS = 1000;

    // ---------------------------------------------------------------- public API

    public static Info parse(String name, String description) {
        String n = name == null ? "" : name;
        String desc = plainText(description);
        ProductForm form = detectForm(n, desc);
        Integer units = unitCount(n, desc, form);
        Double pack = packageGrams(n);
        Double dose = gramsPerServing(desc);

        // A text that lists several pack sizes ("60, odnosno 100 porcija") cannot say which one this
        // variant is, so neither the title nor the description is read for servings in that case.
        boolean ambiguous = SERVINGS_MULTI.matcher(n).find() || SERVINGS_MULTI.matcher(desc).find();
        Integer servings = null;
        if (!ambiguous) {
            servings = servingsFromName(n);
            if (servings == null) servings = servingsFromDescription(desc);
        }
        // Stated weight ÷ stated dose is arithmetic, not a guess: 300 g at 5 g per serving is 60 servings.
        if (servings == null && form == ProductForm.POWDER && pack != null && dose != null) {
            servings = servingsInRange(String.valueOf(Math.round(pack / dose)));
        }
        return new Info(form, detectType(n), pack, dose, servings, units);
    }

    /**
     * Fills the creatine attributes of {@code p} that are still null. {@code variantLabel} is the
     * size/flavour label of a variant row ("60 porcija", "500 g") that the listing title alone
     * does not carry; it is read together with the name.
     */
    public static void enrich(Product p, String variantLabel) {
        String name = p.getName() == null ? "" : p.getName();
        if (variantLabel != null && !variantLabel.isBlank()) name = name + " " + variantLabel;
        Info info = parse(name, p.getDescription());
        if (p.getProductForm() == null) p.setProductForm(info.form().code());
        if (p.getCreatineType() == null) p.setCreatineType(info.type());
        if (p.getCreatineGramsPerServing() == null) p.setCreatineGramsPerServing(info.gramsPerServing());
        if (p.getServingsPerContainer() == null) p.setServingsPerContainer(info.servings());
        if (p.getUnitCount() == null) p.setUnitCount(info.unitCount());
    }

    public static ProductForm detectForm(String name, String plainDescription) {
        String n = name == null ? "" : name;
        if (CAPSULE.matcher(n).find()) return ProductForm.CAPSULE;
        if (TABLET.matcher(n).find()) return ProductForm.TABLET;
        if (GUMMY.matcher(n).find()) return ProductForm.GUMMY;
        if (SACHET.matcher(n).find()) return ProductForm.POWDER;
        if (LIQUID.matcher(n).find()) return ProductForm.LIQUID;

        // Nothing in the title. A big pack count in the text ("120 kapsula") settles it; a dosing
        // remark ("uzimajte 3 kapsule") does not, hence the minimum.
        Matcher m = UNITS.matcher(plainDescription == null ? "" : plainDescription);
        while (m.find()) {
            if (Integer.parseInt(m.group(1)) < DESCRIPTION_MIN_UNITS) continue;
            ProductForm f = formOfUnitWord(m.group(2));
            if (f != ProductForm.POWDER) return f;
        }
        return ProductForm.POWDER;
    }

    /** Creatine chemistry from the title only; {@code null} when the title does not say. */
    public static String detectType(String name) {
        if (name == null || name.isBlank()) return null;
        Set<String> found = new LinkedHashSet<>();
        if (CREAPURE.matcher(name).find()) found.add("creapure");
        if (MONOHYDRATE.matcher(name).find()) found.add("monohydrate");
        if (HCL.matcher(name).find()) found.add("hcl");
        if (BUFFERED.matcher(name).find()) found.add("buffered");
        if (MALATE.matcher(name).find()) found.add("malate");
        if (ETHYL_ESTER.matcher(name).find()) found.add("ethyl_ester");
        if (NITRATE.matcher(name).find()) found.add("nitrate");
        // Creapure is a brand of monohydrate, so "Creapure monohydrate" is one type, not two.
        if (found.contains("creapure")) found.remove("monohydrate");
        if (found.size() >= 2) return "blend";
        if (found.size() == 1) return found.iterator().next();
        return BLEND_WORD.matcher(name).find() ? "blend" : null;
    }

    /** First g/kg amount in the text, in grams; {@code null} when there is none. */
    public static Double packageGrams(String text) {
        return PackageWeights.grams(text);
    }

    /** Grams in ONE sachet when the title states it ("5g Kesica"); {@code null} otherwise, also for a plain count. */
    public static Double gramsPerSachet(String name) {
        if (name == null) return null;
        Matcher m = SACHET_WEIGHT.matcher(name);
        return m.find() ? doseInRange(parseDecimal(m.group(1))) : null;
    }

    /** Pack size in servings from a title; {@code null} for a multi-size title ("60 i 100 porcija"). */
    public static Integer servingsFromName(String name) {
        if (name == null || SERVINGS_MULTI.matcher(name).find()) return null;
        Matcher m = SERVINGS.matcher(name);
        return m.find() ? servingsInRange(m.group(1)) : null;
    }

    public static Integer servingsFromDescription(String plainDescription) {
        if (plainDescription == null || plainDescription.isBlank()) return null;
        for (Pattern p : new Pattern[]{SERVINGS_PER_PACK, SERVINGS_LABELLED}) {
            Matcher m = p.matcher(plainDescription);
            if (m.find()) {
                Integer v = servingsInRange(m.group(1));
                if (v != null) return v;
            }
        }
        return null;
    }

    /** Creatine grams in one serving, from the description; {@code null} when it is not stated. */
    public static Double gramsPerServing(String plainDescription) {
        if (plainDescription == null || plainDescription.isBlank()) return null;
        for (Pattern p : new Pattern[]{DOSE_BEFORE_UNIT, DOSE_AFTER_UNIT}) {
            Matcher m = p.matcher(plainDescription);
            if (m.find()) {
                Double v = doseInRange(parseDecimal(m.group(1)));
                if (v != null) return v;
            }
        }
        Matcher mg = DOSE_MG.matcher(plainDescription);
        if (mg.find()) return doseInRange(parseDecimal(mg.group(1)) / 1000.0);
        return null;
    }

    // ---------------------------------------------------------------- helpers

    private static Integer unitCount(String name, String plainDescription, ProductForm form) {
        Matcher m = UNITS.matcher(name);
        if (m.find()) return unitsInRange(m.group(1), 2);
        if (form.counted()) {
            Matcher d = UNITS.matcher(plainDescription == null ? "" : plainDescription);
            while (d.find()) {
                if (formOfUnitWord(d.group(2)) == form) {
                    Integer v = unitsInRange(d.group(1), DESCRIPTION_MIN_UNITS);
                    if (v != null) return v;
                }
            }
        }
        return null;
    }

    private static ProductForm formOfUnitWord(String word) {
        String w = word.toLowerCase(Locale.ROOT);
        if (w.startsWith("kap") || w.startsWith("cap")) return ProductForm.CAPSULE;
        if (w.startsWith("tab") || w.startsWith("tb")) return ProductForm.TABLET;
        if (w.startsWith("gum") || w.startsWith("bombon")) return ProductForm.GUMMY;
        return ProductForm.POWDER; // sachets / sticks
    }

    private static Integer unitsInRange(String digits, int min) {
        int v = Integer.parseInt(digits);
        return v >= min && v <= MAX_SERVINGS ? v : null;
    }

    private static Integer servingsInRange(String digits) {
        long v = Long.parseLong(digits);
        return v >= MIN_SERVINGS && v <= MAX_SERVINGS ? (int) v : null;
    }

    private static Double doseInRange(double grams) {
        return grams > 0 && grams <= MAX_DOSE_GRAMS ? grams : null;
    }

    private static double parseDecimal(String s) {
        return Double.parseDouble(s.replace(',', '.'));
    }

    private static String plainText(String htmlOrText) {
        return htmlOrText == null || htmlOrText.isBlank() ? "" : Jsoup.parse(htmlOrText).text();
    }
}
