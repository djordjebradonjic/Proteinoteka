-- Market support: add market and currency columns to stores and products

ALTER TABLE stores ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';
ALTER TABLE stores ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'RSD';

ALTER TABLE products ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';
ALTER TABLE products ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'RSD';
ALTER TABLE products ADD COLUMN protein_per_currency DOUBLE PRECISION;

UPDATE stores SET market = 'rs', currency = 'RSD';
UPDATE products SET market = 'rs', currency = 'RSD', protein_per_currency = protein_per_rsd;
