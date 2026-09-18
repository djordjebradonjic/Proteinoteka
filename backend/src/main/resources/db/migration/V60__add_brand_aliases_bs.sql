-- XSport lists Basic Supplements products as "BS ISO-PRO", "BS Vegan Protein", so the scraper
-- extracts the brand "BS". Without an exact alias it fuzzy-matched the unrelated BSN brand
-- (tokenSetRatio("bs","bsn") >= 75), giving those products BSN's score and splitting brand pages.
-- Existing rows heal on the next XSport scrape (the brand field is refreshed whenever a
-- non-blank brand is scraped).
INSERT INTO brand_reputation (brand_name, score, tier, notes, canonical_name) VALUES
  ('BS', 6.0, 'LOW', 'Alias for Basic Supplements (XSport "BS ..." names)', 'Basic Supplements')
ON CONFLICT (brand_name) DO NOTHING;
