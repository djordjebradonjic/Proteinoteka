-- Email engagement tracking on sent alert jobs
ALTER TABLE alert_jobs
    ADD COLUMN opened_at  TIMESTAMP,
    ADD COLUMN clicked_at TIMESTAMP;

CREATE INDEX idx_alert_jobs_opened  ON alert_jobs (opened_at)  WHERE opened_at  IS NOT NULL;
CREATE INDEX idx_alert_jobs_clicked ON alert_jobs (clicked_at) WHERE clicked_at IS NOT NULL;

-- Unsubscribe log: wishlist_items gets deleted on unsubscribe,
-- so we need a separate append-only table to count unsubscribes.
CREATE TABLE alert_unsubscribes (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    product_id BIGINT       NOT NULL,
    job_id     BIGINT,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_unsub_created ON alert_unsubscribes (created_at);
