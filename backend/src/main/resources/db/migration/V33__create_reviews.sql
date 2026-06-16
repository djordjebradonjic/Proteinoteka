CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    email       VARCHAR(255),
    rating      SMALLINT     NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_status     ON reviews(status);
