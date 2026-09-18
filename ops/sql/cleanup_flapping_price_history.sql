-- Cleanup of fake "price drops" already stored in price_history by scraper flapping.
--
-- Background: before the scraper guards (PriceIntegrity), one DB row could receive two different
-- prices in a single scrape run (A -> B), which wrote two price_history rows per run and made the
-- same drop reappear every week. A product is scraped once per run, so two rows of the same
-- product less than 1 hour apart are always noise, never two real repricings.
--
-- What this does: per product, keeps the FIRST row of every burst (that row holds the real price
-- from before the run) and deletes the rest, then recomputes products.last_price_change_at /
-- last_price_drop_pct / last_price_increase_pct for the affected products from what remains
-- (same definition as migrations V52/V53: current price vs the most recent history row).
--
-- Safe by default:
--   * STEP 1 is read-only — review it first.
--   * STEP 2 runs in a transaction that ends with ROLLBACK. Check the output, then change the last
--     line to COMMIT and run it again.
--   * Afterwards the /price-drops list is cached (Spring cache "price-drops") — it refreshes when
--     the cache expires or the backend restarts.
--
-- Usage: psql "$DATABASE_URL" -f cleanup_flapping_price_history.sql

-- ---------------------------------------------------------------------------------------------
-- STEP 1 — preview (read-only): which products / how many rows would be removed
-- ---------------------------------------------------------------------------------------------
WITH ordered AS (
    SELECT id, product_id, timestamp, numeric_price,
           timestamp - LAG(timestamp) OVER (PARTITION BY product_id ORDER BY timestamp, id) AS gap
    FROM price_history
)
SELECT p.id AS product_id,
       s.name AS store,
       p.name,
       p.numeric_price AS current_price,
       COUNT(*) AS noise_rows,
       array_agg(o.numeric_price ORDER BY o.timestamp) AS noise_prices
FROM ordered o
JOIN products p ON p.id = o.product_id
LEFT JOIN stores s ON s.id = p.store_id
WHERE o.gap < INTERVAL '1 hour'
GROUP BY p.id, s.name, p.name, p.numeric_price
ORDER BY noise_rows DESC, p.id;

-- ---------------------------------------------------------------------------------------------
-- STEP 2 — cleanup (transaction; ends in ROLLBACK until you change it to COMMIT)
-- ---------------------------------------------------------------------------------------------
BEGIN;

CREATE TEMP TABLE noise_rows ON COMMIT DROP AS
WITH ordered AS (
    SELECT id, product_id,
           timestamp - LAG(timestamp) OVER (PARTITION BY product_id ORDER BY timestamp, id) AS gap
    FROM price_history
)
SELECT id, product_id FROM ordered WHERE gap < INTERVAL '1 hour';

CREATE TEMP TABLE affected ON COMMIT DROP AS
SELECT DISTINCT product_id FROM noise_rows;

DELETE FROM price_history WHERE id IN (SELECT id FROM noise_rows);

-- Reset, then recompute from the most recent remaining history row.
UPDATE products
SET last_price_change_at = NULL,
    last_price_drop_pct = NULL,
    last_price_increase_pct = NULL
WHERE id IN (SELECT product_id FROM affected);

WITH latest AS (
    SELECT DISTINCT ON (product_id) product_id, numeric_price AS prev_price, timestamp AS ts
    FROM price_history
    WHERE product_id IN (SELECT product_id FROM affected)
    ORDER BY product_id, timestamp DESC, id DESC
)
UPDATE products p
SET last_price_change_at = l.ts,
    last_price_drop_pct = CASE WHEN l.prev_price > p.numeric_price
                               THEN (l.prev_price - p.numeric_price) / l.prev_price END,
    last_price_increase_pct = CASE WHEN p.numeric_price > l.prev_price
                                   THEN (p.numeric_price - l.prev_price) / l.prev_price END
FROM latest l
WHERE l.product_id = p.id
  AND l.prev_price > 0;

-- Sanity check: rows deleted / products touched, and no burst left.
SELECT (SELECT COUNT(*) FROM noise_rows) AS rows_deleted,
       (SELECT COUNT(*) FROM affected)   AS products_touched,
       (SELECT COUNT(*) FROM (
            SELECT timestamp - LAG(timestamp) OVER (PARTITION BY product_id ORDER BY timestamp, id) AS gap
            FROM price_history) g
        WHERE g.gap < INTERVAL '1 hour')  AS bursts_remaining;

ROLLBACK;   -- <- change to COMMIT after reviewing the output above

-- ---------------------------------------------------------------------------------------------
-- OPTIONAL, MANUAL — not part of the run above.
-- GymBeam RS "Protein Soy Isolate" 1000g (product 562): history holds 4090 (2026-07-11) and 4490
-- (2026-07-25) while the store lists 1600 RSD as the regular price (no strike-through) and the HR
-- twin cost 15.95 EUR (~1.870 RSD). Those two rows look like a scrape of a wrong variant, and they
-- produce a fake -64% "drop". Verify in the DB, then delete them by hand:
--   DELETE FROM price_history WHERE product_id = 562 AND numeric_price IN (4090, 4490);
--   UPDATE products SET last_price_change_at = NULL, last_price_drop_pct = NULL,
--                       last_price_increase_pct = NULL WHERE id = 562;
-- ---------------------------------------------------------------------------------------------
