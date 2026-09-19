-- Correct per-100g nutrition on 6 SupplementStore rows, verified against the label images on the
-- product pages (supplementstore.rs/image/catalog/proizvodi/*/labels/*-facts.jpg), 2026-09-19.
--
-- Background: these pages publish the nutrition table only as an image, so the scraper fell back to
-- the description text. "30 g proteina" (per SERVING) was read as 30 %, and other rows carried a
-- placeholder 90 %. The audit (GET /api/admin/data-quality) flagged them as GROUP_PROTEIN_OUTLIER.
--
--   id    product                              was (protein)  label per 100 g
--   775   Maximalium 100% Whey 2.27kg          90             74 g protein, 5.2 fat, 3.0 sugar, 400 kcal
--   776   Maximalium 100% Whey 750g            90             same label as 775
--   786   ON Gold Standard 100% Whey 900g      90             78.5 g protein, 3.8 fat, 372 kcal (EU label)
--   1415  ON Gold Standard 100% Whey 2.27kg    90             24 g per 30.4 g scoop = 78.9 (US label, no per-100g)
--   1343  OstroVit Pea Protein Isolate 480g    30             85 g protein, 8 fat, 0 sugar, 436 kcal
--   1433  Maximalium Isolate Whey 750g         30             91.07 g protein, 1.18 fat, 0.7 sugar
--                                                             (label says 254 kcal, impossible for 91 g protein,
--                                                              so calorie_per_100g is left untouched)
--
-- Deliberately NOT changed:
--   * Proteinbox id 1384 "Iso Cool": 23 g / 26 g = 88.5 %, 92 cal / 26 g = 353.8 kcal are correct per the
--     page; the CALORIE_IMPOSSIBLE flag is a 0.2 kcal rounding artifact (23 g x 4 = 92).
--   * Proteinbox id 507 "Whey Gold": stored 88.5 % is not supported by its page (20 g protein per ~34 g
--     scoop = 58.8 %) and other stores say ~79 %. Needs a look at the real label — decide by hand.
--
-- Safe by default: every UPDATE only matches while protein_per_100g still has the value that was read
-- on 2026-09-19 (so re-running or a concurrent scrape cannot overwrite something newer).
--   * STEP 1 is read-only.
--   * STEP 2 runs in a transaction that ends with ROLLBACK. Check the row counts (expect 1 each),
--     then change the last line to COMMIT and run it again.
-- Afterwards run:  POST /api/admin/recalculate-scores   (value_score / protein_per_rsd depend on protein).
--
-- Usage: psql "$DATABASE_URL" -f fix_supplementstore_nutrition_2026-09-19.sql

-- ---------------------------------------------------------------------------------------------
-- STEP 1 — preview (read-only)
-- ---------------------------------------------------------------------------------------------
SELECT id, name, protein_per_100g AS protein, fat_per_100g AS fat, sugar_per_100g AS sugar,
       calorie_per_100g AS kcal, url
FROM products
WHERE id IN (775, 776, 786, 1415, 1343, 1433)
ORDER BY id;

-- ---------------------------------------------------------------------------------------------
-- STEP 2 — apply (transaction, ends with ROLLBACK until you change it to COMMIT)
-- ---------------------------------------------------------------------------------------------
BEGIN;

-- Maximalium 100% Whey (2.27kg and 750g share the same label)
UPDATE products SET protein_per_100g = 74,    fat_per_100g = 5.2,  sugar_per_100g = 3.0, calorie_per_100g = 400
WHERE id IN (775, 776) AND store_id = 10 AND protein_per_100g = 90;

-- Optimum Nutrition Gold Standard 100% Whey 900g (EU label)
UPDATE products SET protein_per_100g = 78.5,  fat_per_100g = 3.8,  calorie_per_100g = 372
WHERE id = 786 AND store_id = 10 AND protein_per_100g = 90;

-- Optimum Nutrition Gold Standard 100% Whey 2.27kg (US label: 24 g protein per 30.4 g)
UPDATE products SET protein_per_100g = 78.9
WHERE id = 1415 AND store_id = 10 AND protein_per_100g = 90;

-- OstroVit Pea Protein Isolate 480g
UPDATE products SET protein_per_100g = 85,    fat_per_100g = 8,    sugar_per_100g = 0,   calorie_per_100g = 436
WHERE id = 1343 AND store_id = 10 AND protein_per_100g = 30;

-- Maximalium Isolate Whey Protein 100% 750g
UPDATE products SET protein_per_100g = 91.07, fat_per_100g = 1.18, sugar_per_100g = 0.7
WHERE id = 1433 AND store_id = 10 AND protein_per_100g = 30;

-- Check: the six rows with their new values
SELECT id, name, protein_per_100g AS protein, fat_per_100g AS fat, sugar_per_100g AS sugar, calorie_per_100g AS kcal
FROM products WHERE id IN (775, 776, 786, 1415, 1343, 1433) ORDER BY id;

ROLLBACK;  -- change to COMMIT after checking that every UPDATE above reported "UPDATE 1" (775/776: "UPDATE 2")
