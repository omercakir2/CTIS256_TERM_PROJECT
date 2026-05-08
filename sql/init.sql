USE sustainable_market;

-- ---------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('market', 'consumer') NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    market_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    normal_price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NOT NULL,
    expiration_date DATE NOT NULL,
    image_url VARCHAR(255) DEFAULT 'placeholder.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consumer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE sustainable_market;

-- ---------------------------------------------------------
-- CLEAR EXISTING DATA (order matters due to FK constraints)
-- ---------------------------------------------------------
DELETE FROM carts;
DELETE FROM products;
DELETE FROM users;

-- Reset auto increment
ALTER TABLE carts AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- ---------------------------------------------------------
-- MARKETS (ID: 1-4) — Password: password123
-- ---------------------------------------------------------
INSERT INTO users (id, email, password, role, name, city, district, is_verified) VALUES
(1, 'test_market@test.com',   '$2b$10$lJd14FoDgZmaRcptH/fct.FN9PKYKMELggqMXx69HVFwrCmzTaIE6', 'market', 'Market Express',  'Ankara',   'Bilkent',      TRUE),
(2, 'furkan_consumer@test.com', '$2b$10$lJd14FoDgZmaRcptH/fct.FN9PKYKMELggqMXx69HVFwrCmzTaIE6', 'consumer', 'Furkan', 'Ankara',   'Cankaya',      TRUE),
(3, 'eren_consumer@test.com',   '$2b$10$lJd14FoDgZmaRcptH/fct.FN9PKYKMELggqMXx69HVFwrCmzTaIE6', 'consumer', 'Eren',  'Ankara',   'Cankaya', TRUE),
(4, 'oguz_consumer@test.com',   '$2b$10$lJd14FoDgZmaRcptH/fct.FN9PKYKMELggqMXx69HVFwrCmzTaIE6', 'consumer', 'Oguz',    'Ankara', 'Mamak',     TRUE),
(5, 'omer_consumer@test.com',   '$2b$10$lJd14FoDgZmaRcptH/fct.FN9PKYKMELggqMXx69HVFwrCmzTaIE6', 'consumer', 'Omer',    'Ankara', 'Mamak',     TRUE);


-- ── Market 1: Omer Express (Ankara / Bilkent) ──────────────────────────────
INSERT INTO products (market_id, title, stock, normal_price, discounted_price, expiration_date, image_url) VALUES
(1, 'Ekmek 500g',              30,  10.00,   6.00, '2026-05-09', 'product-1746100001000.jpg'),
(1, 'Tam Yag Sut 1L',          20,  35.00,  22.00, '2026-05-14', 'product-1746100002000.jpg'),
(1, 'Beyaz Peynir 400g',       15,  85.00,  55.00, '2026-05-20', 'product-1746100003000.jpg'),
(1, 'Yumurta 10lu',            25,  60.00,  40.00, '2026-05-25', 'product-1746100004000.jpg'),
(1, 'Zeytinyagi 500ml',        10, 220.00, 150.00, '2026-11-01', 'product-1746100005000.jpg'),
(1, 'Makarna 500g',            40,  25.00,  15.00, '2026-12-01', 'product-1746100006000.jpg'),
(1, 'Domates Salcasi 700g',    18,  55.00,  35.00, '2026-10-01', 'product-1746100007000.jpg'),
(1, 'Ayran 500ml',             22,  18.00,  10.00, '2026-05-12', 'product-1746100008000.jpg'),
(1, 'Cips Parti Boy 150g',     12,  45.00,  28.00, '2026-07-15', 'product-1746100009000.jpg'),
(1, 'Portakal Suyu 1L',         8,  50.00,  30.00, '2026-05-11', 'product-1746100010000.jpg');