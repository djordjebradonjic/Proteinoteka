DELETE FROM products
WHERE id NOT IN (
    SELECT MIN(id)
    FROM products
    GROUP BY url
);

ALTER TABLE products ADD CONSTRAINT unique_product_url UNIQUE (url);