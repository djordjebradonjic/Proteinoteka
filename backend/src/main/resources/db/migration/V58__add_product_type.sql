ALTER TABLE products ADD COLUMN product_type VARCHAR(20) NOT NULL DEFAULT 'protein';
CREATE INDEX idx_products_product_type ON products(product_type);

ALTER TABLE products ADD COLUMN creatine_grams_per_serving DOUBLE PRECISION;
ALTER TABLE products ADD COLUMN servings_per_container INTEGER;
ALTER TABLE products ADD COLUMN creatine_type VARCHAR(30);
