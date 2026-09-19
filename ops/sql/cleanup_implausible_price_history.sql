-- Cleanup of fake "price drops" caused by a DB row that switched to a different product/pack.
--
-- Background: when the scraper re-points one products row at another item (same brand + weight, e.g.
-- GymBeam "Mutant Whey + poklon" 7190 RSD -> "Mutant Mass" 3490 RSD, or "True Whey" 4490 ->
-- "Soy Isolate" 1600), the old price_history rows still belong to the previous item. The current
-- price is right, the "previous price" is not, and it shows up as a -50..-65% "biggest drop".
-- These rows are weeks apart, so cleanup_flapping_price_history.sql (timing based) does not see them.
--
-- The code now treats a move of more than 50% between the most recent history row and the current
-- price as not credible (PriceIntegrity.isCredibleChange) and stops writing such history. This
-- script removes what is already stored, using exactly that rule:
--   for each product whose current price is more than 50% BELOW its most recent history row, delete
--   ALL of its history rows and clear the drop/increase columns. A row that was re-pointed has no
--   trustworthy history at all, so a partial delete would leave older prices of the previous item
--   behind.
--   Only DROPS are cleaned. A >50% increase (verified 2026-09-19 on 9 products, e.g. USN Blue Lab
--   HR 44.51 -> 69.62) is an ended promotion: the history is true, it is just never shown as a drop.
--
-- Safe by default:
--   * STEP 1 is read-only — review it. Anything that is a genuine >50% sale you want to keep can be
--     excluded by adding its id to the NOT IN list in STEP 2.
--   * STEP 2 ends in ROLLBACK. Check the output, change the last line to COMMIT and run it again.
--   * Afterwards call POST /api/admin/recalculate-price-changes (or wait for the caches to expire).
--
-- Usage: psql "$DATABASE_URL" -f cleanup_implausible_price_history.sql

-- ---------------------------------------------------------------------------------------------
-- STEP 1 — preview (read-only)
-- ---------------------------------------------------------------------------------------------
WITH latest AS (
    SELECT DISTINCT ON (product_id) product_id, numeric_price AS prev_price, timestamp AS prev_ts
    FROM price_history
    WHERE numeric_price > 0
    ORDER BY product_id, timestamp DESC, id DESC
)
SELECT p.id AS product_id,
       s.name AS store,
       p.name,
       p.canonical_slug,
       l.prev_price,
       p.numeric_price AS current_price,
       ROUND(((p.numeric_price - l.prev_price) / l.prev_price * 100)::numeric, 1) AS change_pct,
       l.prev_ts,
       (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) AS history_rows
FROM latest l
JOIN products p ON p.id = l.product_id
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.numeric_price > 0
  AND (l.prev_price - p.numeric_price) / l.prev_price > 0.5
ORDER BY change_pct;

-- ---------------------------------------------------------------------------------------------
-- STEP 2 — cleanup (transaction; ends in ROLLBACK until you change it to COMMIT)
-- ---------------------------------------------------------------------------------------------
BEGIN;

CREATE TEMP TABLE implausible ON COMMIT DROP AS
WITH latest AS (
    SELECT DISTINCT ON (product_id) product_id, numeric_price AS prev_price
    FROM price_history
    WHERE numeric_price > 0
    ORDER BY product_id, timestamp DESC, id DESC
)
SELECT p.id AS product_id
FROM latest l
JOIN products p ON p.id = l.product_id
WHERE p.numeric_price > 0
  AND (l.prev_price - p.numeric_price) / l.prev_price > 0.5
  AND p.id NOT IN (0);   -- <- add ids of genuine >50% sales you want to keep

DELETE FROM price_history WHERE product_id IN (SELECT product_id FROM implausible);

UPDATE products
SET last_price_change_at = NULL,
    last_price_drop_pct = NULL,
    last_price_increase_pct = NULL
WHERE id IN (SELECT product_id FROM implausible);

-- Sanity check: products touched, and none left violating the rule.
SELECT (SELECT COUNT(*) FROM implausible) AS products_cleaned,
       (SELECT COUNT(*)
          FROM (SELECT DISTINCT ON (product_id) product_id, numeric_price AS prev_price
                  FROM price_history WHERE numeric_price > 0
                 ORDER BY product_id, timestamp DESC, id DESC) l
          JOIN products p ON p.id = l.product_id
         WHERE p.numeric_price > 0
           AND (l.prev_price - p.numeric_price) / l.prev_price > 0.5) AS still_implausible;

ROLLBACK;   -- <- change to COMMIT after reviewing the output above
