-- V44: Add global brands active on HR/RS market that were missing from brand_reputation

INSERT INTO brand_reputation (brand_name, score, tier, notes) VALUES
    -- The Protein Works: well-established UK brand, direct-to-consumer, lab tested
    ('The Protein Works', 7.5, 'MID', 'UK brend, direktna prodaja, lab testiranje, solidan izbor'),
    -- PVL: Canadian brand (Mutant line), decent reputation
    ('PVL',               6.5, 'MID', 'Kanadski brend, poznat po Mutant liniji'),
    -- Biotech USA aliases that may appear differently scraped
    ('BioTechUSA',        7.5, 'MID', 'Alias za BioTech USA'),
    -- Olimp Sport Nutrition: canonical name used by some scrapers
    ('Olimp Sport Nutrition', 7.0, 'MID', 'Alias za OLIMP — polski brend'),
    -- Warrior: UK brand, growing in HR market
    ('Warrior',           6.5, 'MID', 'UK brend sportske prehrane'),
    -- PhD Nutrition alias
    ('PhD',               7.0, 'MID', 'Alias za PhD Nutrition'),
    -- Vitobest: Spanish brand present in EU
    ('Vitobest',          6.5, 'MID', 'Španski brend sportske prehrane')
ON CONFLICT (brand_name) DO NOTHING;
