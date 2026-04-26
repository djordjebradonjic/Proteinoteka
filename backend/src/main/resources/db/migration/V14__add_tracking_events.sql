CREATE TABLE tracking_events (
    id          BIGSERIAL PRIMARY KEY,
    event_type  VARCHAR(50)  NOT NULL,
    product_id  BIGINT,
    store       VARCHAR(100),
    query       VARCHAR(500),
    user_agent  VARCHAR(500),
    ip_address  VARCHAR(50),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_te_event_type  ON tracking_events(event_type);
CREATE INDEX idx_te_created_at  ON tracking_events(created_at);
CREATE INDEX idx_te_product_id  ON tracking_events(product_id);
