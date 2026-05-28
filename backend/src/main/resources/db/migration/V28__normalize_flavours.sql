-- V28: Normalize inconsistent flavour names in product_flavours

-- ── 1. Fix missing diacritics / typos ────────────────────────────────────────
UPDATE product_flavours SET flavour = 'Čokolada'          WHERE flavour = 'Cokolada';
UPDATE product_flavours SET flavour = 'Belgijska čokolada' WHERE flavour = 'belgijska cokolada';
UPDATE product_flavours SET flavour = 'Belgijska čokolada' WHERE flavour = 'Belgian Chocolate';
UPDATE product_flavours SET flavour = 'Kokos'              WHERE flavour = 'kokos';

-- ── 2. Cookie & Cream variants → single canonical form ───────────────────────
UPDATE product_flavours SET flavour = 'Cookies & Cream' WHERE flavour = 'Cookie and cream';
UPDATE product_flavours SET flavour = 'Cookies & Cream' WHERE flavour = 'Cookie''s & Cream';

-- ── 3. "Bez ukusa" variants ───────────────────────────────────────────────────
UPDATE product_flavours SET flavour = 'Bez ukusa' WHERE flavour = 'Natural bez ukusa';
UPDATE product_flavours SET flavour = 'Bez ukusa' WHERE flavour = 'Neutral';

-- ── 4. Spacing normalization ──────────────────────────────────────────────────
UPDATE product_flavours SET flavour = 'Čokolada - kokos' WHERE flavour = 'Čokolada-kokos';

-- ── 5. English → Serbian (Supplementshop scraper had no normalization map) ───
UPDATE product_flavours SET flavour = 'Vanila'          WHERE flavour = 'Vanilla';
UPDATE product_flavours SET flavour = 'Vanila krem'     WHERE flavour IN ('Vanilla Creme', 'Creamy Vanilla');
UPDATE product_flavours SET flavour = 'Vanila sladoled' WHERE flavour IN ('Vanilla Ice Cream', 'Ice Cream Vanilla');
UPDATE product_flavours SET flavour = 'Jagoda - jogurt' WHERE flavour = 'Strawberry Yoghurt';
UPDATE product_flavours SET flavour = 'Slana karamela'  WHERE flavour = 'Salted Caramel';
UPDATE product_flavours SET flavour = 'Jagoda'          WHERE flavour IN ('Strawberry', 'Strawberry Delight');
UPDATE product_flavours SET flavour = 'Jagoda krem'     WHERE flavour IN ('Strawberries & Cream', 'Strawberries Creme');
UPDATE product_flavours SET flavour = 'Dupla čokolada'  WHERE flavour = 'Double Chocolate';

-- ── 6. Proteini.si slugs that bypassed FLAVOUR_MAP ───────────────────────────
UPDATE product_flavours SET flavour = 'Jabuka - cimet'         WHERE flavour = 'apple-cinnamon';
UPDATE product_flavours SET flavour = 'Banana palačinka'       WHERE flavour = 'banan-pancake';
UPDATE product_flavours SET flavour = 'Čokoladni kolač'        WHERE flavour = 'chocolate-cake';
UPDATE product_flavours SET flavour = 'Čokolada - karamela'    WHERE flavour = 'chocolate-caramel';
UPDATE product_flavours SET flavour = 'Čokolada'               WHERE flavour = 'chocolate-cocoa';
UPDATE product_flavours SET flavour = 'Čokolada'               WHERE flavour = 'double-rich-chocolate';
UPDATE product_flavours SET flavour = 'Mlečna čokolada'        WHERE flavour = 'extreme-milk-chocolate';
UPDATE product_flavours SET flavour = 'Vanila krem'            WHERE flavour = 'french-vanilla-cream';
UPDATE product_flavours SET flavour = 'Ledena kafa'            WHERE flavour = 'ice-coffee';
UPDATE product_flavours SET flavour = 'Jagoda krem'            WHERE flavour = 'strawberry-cream';
UPDATE product_flavours SET flavour = 'Jagoda - bela čokolada' WHERE flavour = 'strawberry-whit-chocolate';
UPDATE product_flavours SET flavour = 'Vanila sladoled'        WHERE flavour = 'vanilla-ice-cream';
UPDATE product_flavours SET flavour = 'Bela čokolada - kokos'  WHERE flavour = 'white-chocolatecoconut';

-- ── 7. Remove duplicates created by normalization (no unique constraint) ──────
DELETE FROM product_flavours
WHERE ctid NOT IN (
    SELECT min(ctid)
    FROM product_flavours
    GROUP BY product_id, flavour
);

-- ── 8. Add unique constraint to prevent future duplicates ────────────────────
ALTER TABLE product_flavours ADD CONSTRAINT uq_product_flavour UNIQUE (product_id, flavour);
