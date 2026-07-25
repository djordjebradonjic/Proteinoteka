-- Enforces the invariant that canonical_slug is set once at product creation and never
-- changed afterward — the exact rule the 2026-06-28 V46 migration violated (bulk-appended
-- "-hr" to 186 already-indexed HR products), which regenerated a fresh 301-redirect wave
-- for previously-stable, already-indexed URLs in Google Search Console.
--
-- Application code (ScraperService) only ever sets canonical_slug when it is NULL, so this
-- trigger never blocks legitimate app writes. It exists to stop a future one-off SQL
-- migration or admin script from silently repeating the V46 mistake.
--
-- A genuinely intentional override (e.g. fixing a slug collision for NOT-YET-indexed rows)
-- must opt in explicitly:
--   SET LOCAL app.allow_canonical_slug_override = 'true';
--   UPDATE products SET canonical_slug = ... WHERE ...;
CREATE OR REPLACE FUNCTION protect_canonical_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.canonical_slug IS NOT NULL
       AND NEW.canonical_slug IS DISTINCT FROM OLD.canonical_slug
       AND current_setting('app.allow_canonical_slug_override', true) IS DISTINCT FROM 'true'
    THEN
        RAISE EXCEPTION 'canonical_slug is immutable once set (product id=%, old=%, new=%). If this override is truly intentional, wrap the statement with: SET LOCAL app.allow_canonical_slug_override = ''true'';',
            OLD.id, OLD.canonical_slug, NEW.canonical_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_canonical_slug ON products;
CREATE TRIGGER trg_protect_canonical_slug
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION protect_canonical_slug();
