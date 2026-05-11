-- ═══════════════════════════════════════════════════════
--  V21 — Price Alert System
-- ═══════════════════════════════════════════════════════

-- 1. Extend wishlist_items with alert fields
ALTER TABLE wishlist_items
    ADD COLUMN price_at_subscription NUMERIC(10, 2),
    ADD COLUMN last_notified_at      TIMESTAMP,
    ADD COLUMN target_price          NUMERIC(10, 2);

-- unsubscribe_token: populate existing rows before adding NOT NULL
ALTER TABLE wishlist_items ADD COLUMN unsubscribe_token UUID;
UPDATE wishlist_items SET unsubscribe_token = gen_random_uuid() WHERE unsubscribe_token IS NULL;
ALTER TABLE wishlist_items ALTER COLUMN unsubscribe_token SET NOT NULL;
ALTER TABLE wishlist_items ALTER COLUMN unsubscribe_token SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX idx_wishlist_unsubscribe_token ON wishlist_items (unsubscribe_token);

-- 2. Alert jobs: one row per email to send
CREATE TABLE alert_jobs
(
    id               BIGSERIAL      PRIMARY KEY,
    wishlist_item_id BIGINT         NOT NULL REFERENCES wishlist_items (id) ON DELETE CASCADE,
    product_id       BIGINT         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    email            VARCHAR(255)   NOT NULL,
    old_price        NUMERIC(10, 2) NOT NULL,
    new_price        NUMERIC(10, 2) NOT NULL,
    percentage_drop  NUMERIC(5, 2)  NOT NULL,
    is_30d_low       BOOLEAN        NOT NULL DEFAULT FALSE,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at          TIMESTAMP,
    failure_reason   TEXT,
    retry_count      INTEGER        NOT NULL DEFAULT 0
);

CREATE INDEX idx_alert_jobs_status     ON alert_jobs (status);
CREATE INDEX idx_alert_jobs_created_at ON alert_jobs (created_at);
CREATE INDEX idx_alert_jobs_product_id ON alert_jobs (product_id);
