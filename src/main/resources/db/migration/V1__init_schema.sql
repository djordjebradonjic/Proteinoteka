CREATE TABLE stores (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL UNIQUE,
                        base_url TEXT NOT NULL
);

CREATE TABLE products (
                          id SERIAL PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          brand VARCHAR(100),
                          price NUMERIC(10, 2),
                          image_url TEXT,
                          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stores (name, base_url) VALUES ('Pansport', 'https://www.pansport.rs');