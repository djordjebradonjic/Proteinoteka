-- V27: Brand normalization — add canonical_name support, fix existing data, add missing brands

-- ── 1. Add canonical_name column to brand_reputation ─────────────────────────
ALTER TABLE brand_reputation ADD COLUMN IF NOT EXISTS canonical_name VARCHAR(100) NULL;

-- ── 2. Fix existing alias in V10 (Biotech → BioTech USA) ─────────────────────
UPDATE brand_reputation SET canonical_name = 'BioTech USA' WHERE brand_name = 'Biotech';

-- ── 3. Fix existing products with wrong/inconsistent brand names ──────────────

-- OstroVit: tri različita pisanja → jedan kanonski oblik
UPDATE products SET brand = 'OstroVit' WHERE brand IN ('OSTROVIT', 'Ostrovit');

-- Nutrend: dva pisanja → jedan kanonski oblik
UPDATE products SET brand = 'Nutrend' WHERE brand = 'NUTREND';

-- Dorian Yates: DorianYates → DY Nutrition (kanonski naziv brenda)
UPDATE products SET brand = 'DY Nutrition' WHERE brand = 'DorianYates';

-- Skull Labs: SKULL → Skull Labs
UPDATE products SET brand = 'Skull Labs' WHERE brand = 'SKULL';

-- SciTech → Scitec Nutrition (greška pri scrapovanju)
UPDATE products SET brand = 'Scitec Nutrition' WHERE brand = 'SciTech';

-- Body Attack: stars/Body Attack → Body Attack (rating zvezdice spojene sa nazivom)
UPDATE products SET brand = 'Body Attack' WHERE brand LIKE '%Body Attack%' AND brand != 'Body Attack';

-- 5 → 5 Stars (brend sa ovim imenom)
UPDATE products SET brand = '5 Stars' WHERE brand = '5';

-- PROTEINI.SI → NULL (naziv prodavnice, ne brend)
UPDATE products SET brand = NULL WHERE brand = 'PROTEINI.SI';


-- ── 4. Dodaj kanonske brendove koji nedostaju u brand_reputation ──────────────

INSERT INTO brand_reputation (brand_name, score, tier, notes) VALUES
    ('OstroVit',       7.0, 'MID', 'Polski brend, popularan na Balkanu'),
    ('Nutrend',        7.5, 'MID', 'Češki brend, solidan kvalitet'),
    ('Body Attack',    7.0, 'MID', 'Nemački brend za sportsku ishranu'),
    ('Skull Labs',     6.5, 'MID', 'Brend sportske ishrane'),
    ('BATTERY',        6.5, 'MID', 'Slovenački brend'),
    ('OLIMP',          7.0, 'MID', 'Polski brend, poznat u regionu'),
    ('5 Stars',        6.5, 'MID', 'Brend sportske ishrane'),
    ('ExtriFit',       6.5, 'MID', 'Brend sportske ishrane'),
    ('Vitalikum',      6.0, 'LOW', 'Lokalni/regionalni brend'),
    ('Gorila Protein', 6.0, 'LOW', 'Lokalni brend'),
    ('Multipower',     6.5, 'MID', 'Nemački brend, dugotrajna tradicija'),
    ('Azgard',         6.0, 'LOW', 'Lokalni/regionalni brend')
ON CONFLICT (brand_name) DO NOTHING;


-- ── 5. Dodaj aliase sa canonical_name za ispravno buduće normalizovanje ───────

INSERT INTO brand_reputation (brand_name, score, tier, notes, canonical_name) VALUES
    ('OSTROVIT',     7.0, 'MID', 'Alias za OstroVit',        'OstroVit'),
    ('Ostrovit',     7.0, 'MID', 'Alias za OstroVit',        'OstroVit'),
    ('NUTREND',      7.5, 'MID', 'Alias za Nutrend',         'Nutrend'),
    ('DorianYates',  7.0, 'MID', 'Alias za DY Nutrition',    'DY Nutrition'),
    ('Dorian Yates', 7.0, 'MID', 'Alias za DY Nutrition',    'DY Nutrition'),
    ('SciTech',      8.5, 'TOP', 'Alias za Scitec Nutrition', 'Scitec Nutrition'),
    ('SKULL',        6.5, 'MID', 'Alias za Skull Labs',       'Skull Labs'),
    ('5',            6.5, 'MID', 'Alias za 5 Stars',          '5 Stars')
ON CONFLICT (brand_name) DO NOTHING;
