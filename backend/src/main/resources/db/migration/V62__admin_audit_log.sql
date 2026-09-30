-- Who did what in the admin panel (destructive actions, newsletter sends, maintenance jobs).
CREATE TABLE admin_audit_log (
    id         BIGSERIAL PRIMARY KEY,
    action     VARCHAR(60)  NOT NULL,
    detail     VARCHAR(500),
    ip         VARCHAR(64),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);
