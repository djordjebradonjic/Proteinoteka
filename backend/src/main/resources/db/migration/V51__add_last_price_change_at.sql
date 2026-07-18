-- Adds a denormalized "last price change" timestamp on products so the
-- "recently changed price" sort can be a plain indexed ORDER BY instead of a
-- MAX(timestamp)/GROUP BY over price_history on every listing request.

ALTER TABLE products ADD COLUMN last_price_change_at TIMESTAMP;

-- Backfill from the existing price_history rows (a row is only ever inserted
-- there when the price actually changed, so MAX(timestamp) per product is
-- exactly "when did this product's price last change").
UPDATE products p
SET last_price_change_at = (
    SELECT MAX(ph.timestamp) FROM price_history ph WHERE ph.product_id = p.id
);

CREATE INDEX idx_products_last_price_change_at ON products (last_price_change_at DESC NULLS LAST);
