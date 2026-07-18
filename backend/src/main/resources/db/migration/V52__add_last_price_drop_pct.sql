-- Denormalized "biggest price drop" percentage, mirroring the logic already
-- used by GET /api/v1/products/price-drops (current price vs. the single most
-- recent price_history entry), so it can be a sort option over the full,
-- paginated/filtered product listing without a per-request full-table scan.

ALTER TABLE products ADD COLUMN last_price_drop_pct DOUBLE PRECISION;

WITH latest_history AS (
    SELECT DISTINCT ON (product_id) product_id, numeric_price AS prev_price
    FROM price_history
    ORDER BY product_id, timestamp DESC
)
UPDATE products p
SET last_price_drop_pct = (lh.prev_price - p.numeric_price) / lh.prev_price
FROM latest_history lh
WHERE lh.product_id = p.id
  AND lh.prev_price > p.numeric_price
  AND lh.prev_price > 0;

CREATE INDEX idx_products_last_price_drop_pct ON products (last_price_drop_pct DESC NULLS LAST);
