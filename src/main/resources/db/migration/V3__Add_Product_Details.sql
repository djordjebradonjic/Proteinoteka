-- 1. Dodajemo opis u glavnu tabelu products
ALTER TABLE products ADD COLUMN description TEXT;


CREATE TABLE product_package_weights (
                                         product_id BIGINT NOT NULL,
                                         package_weight VARCHAR(255),
                                         CONSTRAINT fk_product_package_weight FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE product_flavours (
                                  product_id BIGINT NOT NULL,
                                  flavour VARCHAR(255),
                                  CONSTRAINT fk_product_flavour FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);