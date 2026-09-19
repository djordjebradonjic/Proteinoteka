-- Three Nutriversum listings are filed under the wrong brand, so /nutriversum-proteini and brand
-- statistics miss them. 534 sits in the same product group as the other Nutriversum "ISO Pro"
-- listings (group 190); 363 and 417 say Nutriversum in the product name.
-- Preview first, then COMMIT by hand. Rolls back by default.
BEGIN;
SELECT id, brand, name FROM products WHERE id IN (534, 363, 417);
UPDATE products SET brand = 'Nutriversum'
 WHERE id IN (534, 363, 417) AND brand IN ('ISO', 'PurePro');
SELECT id, brand, name FROM products WHERE id IN (534, 363, 417);
ROLLBACK;  -- change to COMMIT once the preview above looks right
