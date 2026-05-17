-- Clean garbage text from FitLab product names scraped via h2.text().
-- The scraper was capturing sibling DOM nodes (category label, price, stock
-- status) alongside the product title. This migration strips those suffixes
-- from existing records using the same rules as ProductNameCleaner.java.
--
-- Rules applied in order (mirrors ProductNameCleaner.clean()):
--   1. Strip "Kategorija" and everything after it (case-insensitive)
--   2. Strip trailing price pattern  (e.g. "2.490 RSD...")
--   3. Strip trailing action text    ("Nema na stanju", "Dodaj u korpu", "Na stanju")
--   4. Strip trailing stray dash     (" -" or "- ")
--   5. Final trim
--
-- Leading discount prefixes ("-15% ") are intentionally left out here because
-- PostgreSQL regexp_replace with 'i' flag is enough and the Kategorija strip
-- handles everything from that point onward in the real data.

UPDATE products
SET name = TRIM(
               REGEXP_REPLACE(
               REGEXP_REPLACE(
               REGEXP_REPLACE(
               REGEXP_REPLACE(
                   name,
                   '\s*Kategorija.*$', '', 'i'),   -- rule 2: strip from Kategorija
                   '\s+[0-9][0-9.,]*\s*(RSD|rsd|din).*$', ''),  -- rule 3: trailing price
                   '\s+(Nema na stanju|Dodaj u korpu|Na stanju).*$', '', 'i'),  -- rule 4: action
                   '\s*-\s*$', '')                 -- rule 5: trailing dash
           )
WHERE store_id = (SELECT id FROM stores WHERE LOWER(name) = 'fitlab')
  AND (
      name LIKE '%Kategorija%'
   OR name LIKE '%Nema na stanju%'
   OR name LIKE '%Dodaj u korpu%'
   OR name LIKE '%Na stanju%'
  );
