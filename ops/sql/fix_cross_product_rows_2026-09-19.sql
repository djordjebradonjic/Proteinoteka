-- One-off data fixes found by the 2026-09-19 price-drop audit (verified against the live store pages
-- and the production API). Everything runs in ONE transaction and ends in COMMIT; every statement is
-- guarded by the exact values it expects, so if the data changed since the audit it touches 0 rows
-- (check the row counts in the output: 1 / 1 / 1 / 2 / 1 / 1 / 1 ...).
--
-- Backup of all price_history + price columns taken before the cleanup:
--   ~/Desktop/proteinoteka-backups/2026-09-19/*_ALL_before.csv

BEGIN;

-- 1. Lama swaps 7400 / 10900 between two different 2 kg products.
--    "100% Whey Isolate" (1417) really costs 7400; 10900 is the price of "Shadowhey" (731).
--    "Shadowhey" (731) really costs 10900 -> 9500; its 7400 row is the Isolate's price.
DELETE FROM price_history WHERE product_id = 1417 AND numeric_price = 10900;
DELETE FROM price_history WHERE product_id = 731  AND numeric_price = 7400;

-- 2. GymBeam RS "Protein konoplje" (558) carries a 4590 history row from "Just Whey Grass-Fed"
--    (its creation-time slug) -> fake -49% drop. Its only history row is that one.
DELETE FROM price_history WHERE product_id = 558 AND numeric_price = 4590;

UPDATE products
SET last_price_change_at = NULL, last_price_drop_pct = NULL, last_price_increase_pct = NULL
WHERE id IN (558, 1417);

-- 3. Nutrition of rows that were re-pointed to another product (values from the live store pages).
--    562 GymBeam RS Protein Soy Isolate: per 100 g 384 kcal, fat 0.5, sugars 0.5, protein 87
--        (the DB held True Whey's 77 / 370 / 5.6 / 4.0). ai_description was about True Whey.
--    834 / 989 PVL Mutant Mass (gainer): per 260 g dose 1060 kcal, protein 52, sugars 34, fat 16
--        -> per 100 g 407.7 kcal, protein 20.0, sugars 13.1, fat 6.2 (the DB held Mutant Whey's 86.67% / 60%).
--    ai_description = NULL makes AiDescriptionJob regenerate it after the next scrape.
UPDATE products
SET protein_per_100g = 87, sugar_per_100g = 0.5, fat_per_100g = 0.5, calorie_per_100g = 384, ai_description = NULL
WHERE id = 562 AND protein_per_100g = 77;

UPDATE products
SET protein_per_100g = 20.0, sugar_per_100g = 13.1, fat_per_100g = 6.2, calorie_per_100g = 407.7, ai_description = NULL
WHERE id IN (834, 989) AND protein_per_100g IN (86.67, 60);

-- Sanity check
SELECT p.id, p.name, p.numeric_price, p.protein_per_100g, p.calorie_per_100g,
       p.last_price_drop_pct, p.ai_description IS NULL AS ai_cleared,
       (SELECT string_agg(h.numeric_price::text, ',' ORDER BY h.timestamp)
          FROM price_history h WHERE h.product_id = p.id) AS history
FROM products p
WHERE p.id IN (558, 731, 1417, 562, 834, 989)
ORDER BY p.id;

COMMIT;
