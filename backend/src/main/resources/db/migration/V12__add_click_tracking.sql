CREATE TABLE click_events (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT,
    store_name  VARCHAR,
    ip_address  VARCHAR,
    user_agent  VARCHAR,
    referrer    VARCHAR,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE affiliate_links (
    id                   BIGSERIAL PRIMARY KEY,
    store_name           VARCHAR NOT NULL UNIQUE,
    affiliate_url_pattern VARCHAR,
    is_active            BOOLEAN DEFAULT true,
    created_at           TIMESTAMP DEFAULT NOW()
);
