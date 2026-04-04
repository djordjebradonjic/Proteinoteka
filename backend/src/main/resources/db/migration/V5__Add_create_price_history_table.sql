CREATE TABLE price_history (
                               id BIGSERIAL PRIMARY KEY,
                               price VARCHAR(255) NOT NULL,
                               timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               product_id BIGINT NOT NULL,
                               CONSTRAINT fk_price_history_product
                                   FOREIGN KEY (product_id)
                                       REFERENCES products (id)
                                       ON DELETE CASCADE
);


CREATE INDEX idx_price_history_product_id ON price_history(product_id);