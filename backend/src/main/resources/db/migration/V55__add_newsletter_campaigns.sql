CREATE TABLE newsletter_campaigns (
    id          BIGSERIAL PRIMARY KEY,
    market      VARCHAR(2) NOT NULL,
    sent_count  INTEGER NOT NULL,
    sent_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_newsletter_campaigns_market ON newsletter_campaigns(market, sent_at);
