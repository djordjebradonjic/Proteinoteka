CREATE TABLE product_groups (
    id           BIGSERIAL PRIMARY KEY,
    canonical_name VARCHAR(255) NOT NULL,
    brand        VARCHAR(100),
    weight_grams DOUBLE PRECISION
);

ALTER TABLE products ADD COLUMN group_id BIGINT REFERENCES product_groups(id);
CREATE INDEX idx_products_group_id ON products(group_id);
