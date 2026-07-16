-- Track which market (rs/hr) an email was captured on, matching the convention
-- already used by products/stores/product_groups. Without this, subscriber/alert
-- emails can't be attributed to a storefront or localized correctly.

ALTER TABLE calculator_subscribers ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';
ALTER TABLE wishlist_items ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';
ALTER TABLE alert_unsubscribes ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';

-- Backfill existing rows from the product they reference — calculator_subscribers
-- has no product/store link, so those rows keep the 'rs' default (best-effort, small volume).
UPDATE wishlist_items w SET market = p.market
FROM products p WHERE w.product_id = p.id;

UPDATE alert_unsubscribes u SET market = p.market
FROM products p WHERE u.product_id = p.id;
