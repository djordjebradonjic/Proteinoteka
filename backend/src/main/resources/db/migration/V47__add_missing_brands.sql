-- Add brands missing from brand_reputation that were defaulting to 4.5 brand score.
-- Sources: HR market (Myvegan, Proteos, Ovowhite, Verviavita, Stacker2)
--          RS market (VanaVita, Megabol, 6PAK, BeastPink, ISO, MHN Sport, YEA, PAK alias)

INSERT INTO brand_reputation (brand_name, score, tier, notes, canonical_name) VALUES
  -- MyProtein vegan sub-brand — same manufacturing quality as MyProtein
  ('Myvegan',        7.5, 'MID', 'MyProtein vegan sub-brand',           'MyProtein'),
  -- Croatian local brand
  ('Proteos',        6.0, 'LOW', 'Croatian local protein brand',         NULL),
  -- Spanish egg white protein brand, solid reputation in EU market
  ('Ovowhite',       6.5, 'MID', 'Spanish egg white protein brand',      NULL),
  -- Small Croatian brand, limited track record
  ('Verviavita',     5.5, 'LOW', 'Small Croatian supplement brand',       NULL),
  -- Dutch budget brand, sold widely in EU but lower tier
  ('Stacker2',       6.0, 'LOW', 'Budget European supplement brand',      NULL),
  -- GymBeam BIO/organic sub-brand
  ('VanaVita',       7.0, 'MID', 'GymBeam BIO sub-brand',               'GymBeam'),
  -- Polish multicomponent protein blend brand
  ('Megabol',        6.0, 'LOW', 'Polish supplement brand',              NULL),
  -- Small brand sold via XSport
  ('YEA',            5.5, 'LOW', 'Small regional brand',                 NULL),
  -- Polish brand, canonical entry
  ('6PAK Nutrition', 6.5, 'MID', 'Polish supplement brand',              NULL),
  -- 6PAK short form alias
  ('6PAK',           6.5, 'MID', 'Polish supplement brand',              '6PAK Nutrition'),
  -- Pansport parsing artifact for 6PAK
  ('PAK',            6.5, 'MID', '6PAK alias (scraper artifact)',         '6PAK Nutrition'),
  -- BioTech USA womens sub-brand (Yum Yum Whey)
  ('BeastPink',      7.0, 'MID', 'BioTech USA womens sub-brand',         'BioTech USA'),
  -- Proteini.si private label
  ('ISO',            6.0, 'LOW', 'Proteini.si private label isolate',    NULL),
  -- Small Eastern European brand via Shopbuilder
  ('MHN Sport',      5.5, 'LOW', 'Small Eastern European brand',         NULL)
ON CONFLICT (brand_name) DO NOTHING;
