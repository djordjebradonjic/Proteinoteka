CREATE TABLE stores (
                        id BIGSERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL UNIQUE,
                        base_url TEXT NOT NULL
);

CREATE TABLE products (
                          id BIGSERIAL PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          brand VARCHAR(100),
                          price VARCHAR(255),
                          image_url TEXT,
                          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stores (name, base_url) VALUES ('Pansport', 'https://www.pansport.rs');