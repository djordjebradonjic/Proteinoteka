CREATE TABLE affiliate_configs (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES stores(id),
    market VARCHAR(2) NOT NULL,
    network VARCHAR(50),
    tracking_url_template TEXT,
    affiliate_id VARCHAR(100),
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
