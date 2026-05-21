-- Freeze URL slug so product name changes during re-scraping don't create 301 redirects.
-- canonical_slug is set once on product creation and never updated.

ALTER TABLE products ADD COLUMN canonical_slug TEXT;

-- Populate for all existing products using the same slugify logic as the frontend.
-- translate() handles Serbian characters; regexp_replace() removes non-slug chars and collapses hyphens.
UPDATE products
SET canonical_slug = trim(
  '-' FROM
  regexp_replace(
    regexp_replace(
      lower(translate(name, 'šŠčČćĆžŽđĐ', 'sscccczzdd')),
      '[^a-z0-9\s\-]', '', 'g'
    ),
    '[\s\-]+', '-', 'g'
  )
);
