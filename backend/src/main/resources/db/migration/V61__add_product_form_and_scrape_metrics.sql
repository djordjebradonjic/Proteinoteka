-- Product form + pack size for non-powder supplements (creatine capsules, tablets, gummies).
-- NULL for protein rows: the column is only meaningful for product types that come in several forms.
ALTER TABLE products ADD COLUMN product_form VARCHAR(20);
ALTER TABLE products ADD COLUMN unit_count INTEGER;

-- Per-run scrape metrics. product_type_counts is a compact "type=count" list (e.g. "protein=86,creatine=14")
-- so a new product type needs no schema change; proxy_bytes is the estimated IPRoyal traffic of the run.
ALTER TABLE scrape_log ADD COLUMN product_type_counts VARCHAR(120);
ALTER TABLE scrape_log ADD COLUMN proxy_bytes BIGINT;
