ALTER TABLE products ADD COLUMN IF NOT EXISTS protein_per_rsd DOUBLE PRECISION;

UPDATE products
SET protein_per_rsd = (protein_per_100g / 100.0 * primary_weight_grams) / numeric_price
WHERE protein_per_100g IS NOT NULL
  AND primary_weight_grams IS NOT NULL
  AND numeric_price IS NOT NULL
  AND numeric_price > 0;
