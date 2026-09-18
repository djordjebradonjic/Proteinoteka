-- Brands present in the catalogue that had no brand_reputation row and therefore silently fell back
-- to the 4.5 default brand score (15% of the value score => roughly -0.5..-0.9 points versus a
-- comparable 6.0-7.0 brand). Found by the value-score audit; the new UNKNOWN_BRAND data-quality
-- check lists any future ones.
--
-- Scores are conservative estimates in line with the existing tiers (LOW = private label / regional,
-- MID = established European brand). Adjust here if a brand deserves a different tier.

INSERT INTO brand_reputation (brand_name, score, tier, notes, canonical_name) VALUES
  -- Retailer private labels (own-brand whey/vegan lines)
  ('Proteini.si',             6.0, 'LOW', 'Proteini.si private label',                   NULL),
  ('Polleo Sport Nutrition',  6.0, 'LOW', 'Polleo Sport private label',                  NULL),
  ('Polleo Sport Basic Supps',6.0, 'LOW', 'Polleo Sport budget private label',           NULL),
  ('zoe Nutrition',           6.0, 'LOW', 'Regional supplement brand sold via Polleo',   NULL),
  ('VAST Sports',             6.0, 'LOW', 'Regional supplement/bar brand',               NULL),
  ('SPORTNAHRUNG.AT',         5.5, 'LOW', 'Austrian retailer private label',             NULL),
  ('TopFood',                 5.5, 'LOW', 'Regional private label',                      NULL),
  -- Established brands
  ('Genius Nutrition',        6.5, 'MID', 'Established European sports nutrition brand', NULL),
  ('Mars',                    6.0, 'LOW', 'Confectionery brand protein line (Snickers/Maltesers), not a sports-nutrition specialist', NULL),
  ('Universal-Animal',        7.0, 'MID', 'Universal Nutrition Animal line',             'Universal Nutrition')
ON CONFLICT (brand_name) DO NOTHING;
