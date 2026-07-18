CREATE TABLE newsletter_subscribers (
    id                 BIGSERIAL PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    market             VARCHAR(2) NOT NULL DEFAULT 'rs',
    source             VARCHAR(50),
    unsubscribe_token  UUID NOT NULL DEFAULT gen_random_uuid(),
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_newsletter_subscribers_source ON newsletter_subscribers(source);
CREATE UNIQUE INDEX idx_newsletter_subscribers_token ON newsletter_subscribers(unsubscribe_token);
