ALTER TABLE price_history ADD COLUMN IF NOT EXISTS numeric_price DOUBLE PRECISION;

-- Backfill existing rows using PostgreSQL regex to handle Serbian price formats:
-- "2.490,00 RSD" → 2490.0   "1.950 RSD" → 1950.0   "950,00" → 950.0
UPDATE price_history
SET numeric_price = sub.parsed
FROM (
    SELECT id,
        CASE
            -- "1.950,00" or "2.490,00" — dot thousands, comma decimal
            WHEN regexp_replace(price, '[^0-9.,]', '', 'g') ~ '^\d{1,3}(\.\d{3})+(,\d{1,2})?$'
                THEN replace(replace(regexp_replace(price, '[^0-9.,]', '', 'g'), '.', ''), ',', '.')::DOUBLE PRECISION
            -- "1950,00" or "950,00" — comma decimal, no thousands
            WHEN regexp_replace(price, '[^0-9.,]', '', 'g') ~ '^\d+(,\d{1,2})?$'
                THEN replace(regexp_replace(price, '[^0-9.,]', '', 'g'), ',', '.')::DOUBLE PRECISION
            -- "1.950" — dot as thousands separator only
            WHEN regexp_replace(price, '[^0-9.,]', '', 'g') ~ '^\d+\.\d{3}$'
                THEN replace(regexp_replace(price, '[^0-9.,]', '', 'g'), '.', '')::DOUBLE PRECISION
            -- Fallback: strip all non-digits
            ELSE NULLIF(regexp_replace(price, '[^0-9]', '', 'g'), '')::DOUBLE PRECISION
        END AS parsed
    FROM price_history
    WHERE price IS NOT NULL
) sub
WHERE price_history.id = sub.id
  AND price_history.numeric_price IS NULL;
