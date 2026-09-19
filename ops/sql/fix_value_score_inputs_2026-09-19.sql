-- Correct value-score inputs (protein % / protein source) on 13 rows whose stored values contradict the
-- store's own label or page. Each value below was verified on 2026-09-19 against the live product page
-- or the nutrition-label image it links to (supplementstore.rs/image/catalog/proizvodi/*/labels/*-facts.jpg).
-- Found by GET /api/admin/data-quality (GROUP_PROTEIN_OUTLIER / VALUE_SCORE_SKIPPED / PROTEIN_SOURCE_SUSPECT).
--
--   id            product                                 was                       verified value (per 100 g)
--   803           Nutriversum Casein Pro 700g (SS)        protein 92                73 g protein, 7.7 fat, 4.02 sugar, 415 kcal (label image; the page's
--                                                                                    "23 g per 25 g scoop" was read as 92 %, label says 22 g / 25 g)
--   782, 783      Maximalium Vegan Protein 2270g/750g     protein 30                81.43 g protein, 2.93 fat, 0.84 sugar, 362 kcal (label image; 30 g = serving size)
--   1432          Maximalium Isolate Whey 2270g (SS)      protein 30                91.07 g protein, 1.18 fat, 0.7 sugar (same product/label as 1433 in
--                                                                                    fix_supplementstore_nutrition_2026-09-19.sql; Proteinbox row 499 has 91.07 too)
--   1530, 1531    Starlabs I90 Isolate CFM 1810g/908g     protein 53                87.81 g protein, 0.18 fat, 0.14 sugar, 359 kcal (label image; "53 g" = 2 scoops)
--   764           QNT Skinny Protein 440g                 source whey_isolate       source blend (page: "whey protein blend with collagen and L-carnitine";
--                                                                                    12 g protein per 20 g = 60 % is correct, it was flagged only because 60 % is
--                                                                                    impossible for an isolate)
--   769           Extrifit Caffe Latte Whey 80 1kg (SS)   protein 64.5              80 (product name says 80; Proteinbox lists the same product at 80.0).
--                                                                                    Not checked against the label image: the row has not been refreshed since 08-30.
--   589, 590,     GymBeam Clear Whey IsoFue (RS + HR)     source whey_concentrate   source whey_isolate (page: ingredient "izolat proteina sirutke", CFM
--   954, 955                                                                        microfiltration, 87-88 % protein). Protein 88 % is right.
--   1365          Amix Monster Beef Protein 1kg (Pansport) protein 78.8             90 g protein, 381 kcal (page: 90 g/100 g, 29.7 g per 33 g serving)
--
-- Checked and deliberately NOT changed (the stored value matches the store's own page):
--   * Nutrition Shop HR 1104 / 1105 (price 36.00 EUR is real; 1104 protein 80 is right). 1105 stores 86.67 = 26 g / 30 g,
--     but the page never states the serving size and Proteini.si says 75 % -> needs a look at the real label.
--   * XSport Critical Whey 889 / 903 (25 g per 30 g = 83 %), Ogistrashop Casein 115 (77 g/100 g): correct on their pages;
--     the other stores in the group are the odd ones out.
--   * Proteinbox 507 "Whey Gold" (88.5 %), Lama 731 "Shadowhey" (86 %, carries the nutrition of the row it was re-pointed
--     from), Lama 737 / 1418, Dymatize Elite Whey 867 / 852 vs 1369 / 1368, GymBeam BioTech Vegan 842 vs 458: each needs the
--     real label, the store pages don't settle it.
--
-- Prerequisites: run fix_supplementstore_nutrition_2026-09-19.sql and fix_cross_product_rows_2026-09-19.sql first (or
-- independently - the rows do not overlap). Afterwards run:  POST /api/admin/recalculate-scores
--
-- Safe by default: every UPDATE only matches while the row still has the value that was read on 2026-09-19.
--   * STEP 1 is read-only.
--   * STEP 2 runs in a transaction that ends with ROLLBACK. Check the row counts, then change the last line to COMMIT.
--
-- Usage: psql "$DATABASE_URL" -f fix_value_score_inputs_2026-09-19.sql

-- ---------------------------------------------------------------------------------------------
-- STEP 1 — preview (read-only)
-- ---------------------------------------------------------------------------------------------
SELECT id, name, protein_source AS source, protein_per_100g AS protein, fat_per_100g AS fat,
       sugar_per_100g AS sugar, calorie_per_100g AS kcal, value_score
FROM products
WHERE id IN (803, 782, 783, 1432, 1530, 1531, 764, 769, 589, 590, 954, 955, 1365)
ORDER BY id;

-- ---------------------------------------------------------------------------------------------
-- STEP 2 — apply (transaction, ends with ROLLBACK until you change it to COMMIT)
-- ---------------------------------------------------------------------------------------------
BEGIN;

-- Nutriversum Casein Pro 700g
UPDATE products SET protein_per_100g = 73, fat_per_100g = 7.7, sugar_per_100g = 4.02, calorie_per_100g = 415
WHERE id = 803 AND protein_per_100g = 92;                                   -- expect UPDATE 1

-- Maximalium Vegan Protein (2270g and 750g share the label)
UPDATE products SET protein_per_100g = 81.43, fat_per_100g = 2.93, sugar_per_100g = 0.84, calorie_per_100g = 362
WHERE id IN (782, 783) AND protein_per_100g = 30;                           -- expect UPDATE 2

-- Maximalium Isolate Whey 2270g (calorie_per_100g stays NULL: the label's kcal is impossible for 91 g protein)
UPDATE products SET protein_per_100g = 91.07, fat_per_100g = 1.18, sugar_per_100g = 0.7
WHERE id = 1432 AND protein_per_100g = 30;                                  -- expect UPDATE 1

-- Starlabs I90 Isolate CFM (1810g and 908g)
UPDATE products SET protein_per_100g = 87.81, fat_per_100g = 0.18, sugar_per_100g = 0.14, calorie_per_100g = 359
WHERE id IN (1530, 1531) AND protein_per_100g = 53;                         -- expect UPDATE 2

-- QNT Skinny Protein: whey blend with collagen, not an isolate
UPDATE products SET protein_source = 'blend'
WHERE id = 764 AND protein_source = 'whey_isolate';                         -- expect UPDATE 1

-- Extrifit Caffe Latte Whey 80
UPDATE products SET protein_per_100g = 80
WHERE id = 769 AND protein_per_100g = 64.5;                                 -- expect UPDATE 1

-- GymBeam Clear Whey IsoFue is a whey protein isolate (all four rows together, so their product groups stay intact)
UPDATE products SET protein_source = 'whey_isolate'
WHERE id IN (589, 590, 954, 955) AND protein_source = 'whey_concentrate' AND protein_per_100g = 88;   -- expect UPDATE 4

-- Amix Monster Beef Protein 1kg (Pansport)
UPDATE products SET protein_per_100g = 90, calorie_per_100g = 381
WHERE id = 1365 AND protein_per_100g = 78.8;                                -- expect UPDATE 1

-- Check: the 13 rows with their new values
SELECT id, name, protein_source AS source, protein_per_100g AS protein, fat_per_100g AS fat,
       sugar_per_100g AS sugar, calorie_per_100g AS kcal
FROM products
WHERE id IN (803, 782, 783, 1432, 1530, 1531, 764, 769, 589, 590, 954, 955, 1365)
ORDER BY id;

ROLLBACK;  -- change to COMMIT after checking the row counts above (1 / 2 / 1 / 2 / 1 / 1 / 4 / 1)
