-- Denormalized "biggest price increase" percentage, symmetric counterpart to
-- last_price_drop_pct (V52): current price vs. the single most recent
-- price_history entry, but for upward moves. Lets "biggest markup" be a
-- plain indexed sort over the full listing instead of a full-table scan.

ALTER TABLE products ADD COLUMN last_price_increase_pct DOUBLE PRECISION;

WITH latest_history AS (
    SELECT DISTINCT ON (product_id) product_id, numeric_price AS prev_price
    FROM price_history
    ORDER BY product_id, timestamp DESC
)
UPDATE products p
SET last_price_increase_pct = (p.numeric_price - lh.prev_price) / lh.prev_price
FROM latest_history lh
WHERE lh.product_id = p.id
  AND p.numeric_price > lh.prev_price
  AND lh.prev_price > 0;

CREATE INDEX idx_products_last_price_increase_pct ON products (last_price_increase_pct DESC NULLS LAST);
