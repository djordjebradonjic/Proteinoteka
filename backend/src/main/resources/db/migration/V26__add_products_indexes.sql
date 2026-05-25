-- Performance indexes for the products table.
-- Without these every filtered listing query does a full sequential scan.

-- FK column: no index is created automatically by PostgreSQL for FK constraints.
CREATE INDEX IF NOT EXISTS idx_products_store_id
    ON products (store_id);

-- Brand equality filter (ProductSpecifications uses LOWER(brand) = ?)
CREATE INDEX IF NOT EXISTS idx_products_brand
    ON products (LOWER(brand));

-- Price range filters (minPrice / maxPrice)
CREATE INDEX IF NOT EXISTS idx_products_numeric_price
    ON products (numeric_price);

-- Primary sort column; NULLS LAST matches the JPA sort behaviour
CREATE INDEX IF NOT EXISTS idx_products_value_score
    ON products (value_score DESC NULLS LAST);

-- Category filter (protein_source = ?)
CREATE INDEX IF NOT EXISTS idx_products_protein_source
    ON products (protein_source);

-- Slug lookups on product detail pages
CREATE INDEX IF NOT EXISTS idx_products_canonical_slug
    ON products (canonical_slug);

-- Trigram index for LIKE '%query%' name search (autocomplete + main listing).
-- pg_trgm ships with every standard PostgreSQL installation including Railway.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
    ON products USING GIN (LOWER(name) gin_trgm_ops);
