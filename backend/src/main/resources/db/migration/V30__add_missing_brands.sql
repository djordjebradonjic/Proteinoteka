-- V30: Dodaj brendove koji nedostaju u brand_reputation + sredi neispravna brand polja

-- ── 1. Proteini.si nije brend nego naziv prodavnice ───────────────────────────
UPDATE products SET brand = NULL WHERE LOWER(brand) = 'proteini.si';

-- ── 2. Normalizuj case varijante istog brenda ─────────────────────────────────
-- MusclePharm: 'Musclepharm' i 'Muscle Pharm' → kanonski 'MusclePharm'
UPDATE products SET brand = 'MusclePharm' WHERE brand IN ('Musclepharm', 'Muscle Pharm');

-- SMARTEIN: 'SMARTEIN' → 'Smartein'
UPDATE products SET brand = 'Smartein' WHERE brand = 'SMARTEIN';

-- ── 3. Dodaj nove kanonske brendove ───────────────────────────────────────────
INSERT INTO brand_reputation (brand_name, score, tier, notes) VALUES
    ('MusclePharm',       7.0, 'MID', 'Američki brend, poznat po čistim formulama'),
    ('ActivLab',          7.0, 'MID', 'Polski brend, solidan kvalitet i distribucija'),
    ('Inkospor',          7.0, 'MID', 'Nemački brend, dugogodišnja tradicija'),
    ('Smartein',          6.0, 'LOW', 'Regionalni brend, manji obim tržišta'),
    ('Tesla Nutrition',   6.0, 'LOW', 'Lokalni/regionalni brend'),
    ('Pansport POWER',    6.0, 'LOW', 'Private label Pansport prodavnice'),
    ('PAK',               6.0, 'LOW', 'Manje poznat regionalni brend'),
    ('Active Pharma',     6.0, 'LOW', 'Manje poznat brend'),
    ('Biokanna',          6.5, 'MID', 'Brend fokusiran na prirodne/organske suplemente'),
    ('Pharma Intelligence', 6.0, 'LOW', 'Manje poznat brend'),
    ('Superior',          6.0, 'LOW', 'Manje poznat brend')
ON CONFLICT (brand_name) DO NOTHING;

-- ── 4. Dodaj aliase za normalizovane varijante ────────────────────────────────
INSERT INTO brand_reputation (brand_name, score, tier, notes, canonical_name) VALUES
    ('Musclepharm',  7.0, 'MID', 'Alias za MusclePharm', 'MusclePharm'),
    ('Muscle Pharm', 7.0, 'MID', 'Alias za MusclePharm', 'MusclePharm'),
    ('SMARTEIN',     6.0, 'LOW', 'Alias za Smartein',    'Smartein')
ON CONFLICT (brand_name) DO NOTHING;
