-- Append "-hr" suffix to all HR product canonical_slugs that don't already end in "-hr".
-- Fixes cross-market slug collisions: the same product (e.g. Impact Whey Izolat 2700g)
-- existed with identical slugs in both the "rs" and "hr" markets, causing /by-name
-- to return mixed EUR+RSD prices and SEO canonical URLs to point to wrong-market products.
UPDATE products
SET canonical_slug = canonical_slug || '-hr'
WHERE market = 'hr'
  AND canonical_slug IS NOT NULL
  AND canonical_slug NOT LIKE '%-hr';
