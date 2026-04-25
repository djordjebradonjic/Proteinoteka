CREATE TABLE scrape_log (
    id           BIGSERIAL PRIMARY KEY,
    store_name   VARCHAR(100)  NOT NULL,
    started_at   TIMESTAMP     NOT NULL,
    finished_at  TIMESTAMP,
    products_found INT,
    status       VARCHAR(20)   NOT NULL DEFAULT 'RUNNING',
    error_message VARCHAR(500)
);

CREATE INDEX idx_scrape_log_store_name ON scrape_log(store_name);
CREATE INDEX idx_scrape_log_started_at ON scrape_log(started_at DESC);
