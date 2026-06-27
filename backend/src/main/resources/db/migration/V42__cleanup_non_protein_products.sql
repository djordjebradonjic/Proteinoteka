-- Remove non-protein products that slipped past the scraper filter

-- Polleo Sport: nut butters, protein cream spreads, cookies, bars, mass gainers by name
DELETE FROM products
WHERE store_id = (SELECT id FROM stores WHERE name = 'Polleo Sport')
  AND (
    name ILIKE '%peanut butter%'
    OR name ILIKE '%cashew butter%'
    OR name ILIKE '%almond butter%'
    OR name ILIKE '%lava cookie%'
    OR name ILIKE '%woppers%'
    OR name ILIKE '%baked cookie%'
    OR name ILIKE '%meal replacement%'
    OR name ILIKE '%serious mass%'
    OR name ILIKE '%nitromax%'
    OR name ILIKE '%protein cream%'
    OR name ILIKE '%cocoa cream%'
    OR name ILIKE 'protein buenissimo%'
  );

-- All HR stores: products with protein < 25g/100g are gainers, bars or snacks — not protein supplements
DELETE FROM products
WHERE market = 'hr'
  AND protein_per_100g IS NOT NULL
  AND protein_per_100g < 25.0;

-- GymBeam HR: diet shakes (Fit&Slim line)
DELETE FROM products
WHERE store_id = (SELECT id FROM stores WHERE name = 'GymBeam HR')
  AND name ILIKE '%fit%slim%';
