-- Tracks consecutive scrapes in which a product was expected (existing URL for that store)
-- but not found. ScraperService now only hard-deletes a product once this counter crosses a
-- threshold, instead of deleting on the very first missed scrape — a single transient
-- bot-block or store outage no longer permanently deletes still-listed products.
ALTER TABLE products ADD COLUMN missed_scrapes INT NOT NULL DEFAULT 0;
