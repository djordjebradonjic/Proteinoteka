ALTER TABLE products ADD COLUMN store_id BIGINT;
ALTER TABLE products ADD CONSTRAINT fk_product_store FOREIGN KEY  (store_id) REFERENCES stores (id);