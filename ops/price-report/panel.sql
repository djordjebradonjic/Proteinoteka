-- Matched-basket panel for the monthly price report (READ ONLY).
--
-- One row per RS protein listing that certainly existed at the baseline date:
-- product ids are a monotonic sequence, so every id below :max_id was created before the first
-- scrape of the stores added on the baseline day (2026-06-24, GymBeam min id 553).
-- price_history stores the OLD price with the time of the change, so the price at the baseline
-- is the old price of the first change after it (or the current price if it never changed).
--
--   psql "$DB" -X --csv -v baseline="'2026-06-24'" -v max_id=553 -f panel.sql > panel.csv
--   python3 build.py panel.csv 2026-09 > ../../frontend/lib/price-reports/2026-09.ts
SET default_transaction_read_only = on;
WITH panel AS (
  SELECT p.id, s.name AS store, p.name, p.brand, p.protein_source, p.primary_weight_grams AS w,
         p.protein_per_100g AS prot, p.numeric_price AS p_now, p.last_price_change_at,
         p.value_score, p.last_updated
  FROM products p JOIN stores s ON s.id = p.store_id
  WHERE s.market = 'rs' AND p.product_type = 'protein' AND p.id < :max_id
),
after AS (
  SELECT product_id, COUNT(*) AS n_after, MIN("timestamp") AS first_change,
         (ARRAY_AGG(numeric_price ORDER BY "timestamp" ASC))[1] AS p_then,
         ARRAY_TO_STRING(ARRAY_AGG(numeric_price::text ORDER BY "timestamp" ASC), '>') AS path
  FROM price_history WHERE "timestamp" > :baseline GROUP BY product_id
)
SELECT pa.*, COALESCE(a.p_then, pa.p_now) AS p_then, COALESCE(a.n_after, 0) AS n_after, a.first_change, a.path
FROM panel pa LEFT JOIN after a ON a.product_id = pa.id
ORDER BY pa.id;
