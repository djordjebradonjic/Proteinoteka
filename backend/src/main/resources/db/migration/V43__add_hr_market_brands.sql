-- V43: Add brands relevant to Croatian market that were missing from brand_reputation

INSERT INTO brand_reputation (brand_name, score, tier, notes) VALUES
    -- GymBeam private label: biggest sports nutrition brand in the region, lab-tested products
    ('GymBeam',          7.5, 'MID', 'Najveći sportski webshop u regiji, vlastita linija sa lab testiranjem'),
    -- Prozis: Portuguese brand with wide EU presence including Croatia
    ('Prozis',           7.0, 'MID', 'Portugalski brend, široka distribucija u EU'),
    -- 4+ Nutrition: Italian brand focused on quality, sold via Polleo Sport
    ('4+ Nutrition',     7.0, 'MID', 'Talijanski brend, fokus na kvaliteti, popularan u HR'),
    -- Body & Fit: Dutch brand, own-brand products, popular in EU webshops
    ('Body & Fit',       7.0, 'MID', 'Holandski brend, popularan u EU webshopovima'),
    -- GN Laboratories: German brand
    ('GN Laboratories',  6.5, 'MID', 'Njemački brend sportske prehrane'),
    -- LSP Nutrition: German brand with solid reputation
    ('LSP Nutrition',    7.0, 'MID', 'Njemački brend, solidan kvalitet i transparentnost'),
    -- ProAction: Italian brand sold in some HR stores
    ('ProAction',        6.5, 'MID', 'Talijanski brend sportske prehrane'),
    -- All Stars: German brand
    ('All Stars',        6.5, 'MID', 'Njemački brend sportske prehrane')
ON CONFLICT (brand_name) DO NOTHING;
