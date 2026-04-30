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

-- ---------------------------------------------------------
-- 2. MOCK DATA (Password: password123)
-- ---------------------------------------------------------

-- MARKETS (ID: 1-4)
INSERT INTO users (id, email, password, role, name, city, district, is_verified) VALUES
(1, 'omer_market@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'market', 'Omer Express', 'Ankara', 'Bilkent', TRUE),
(2, 'furkan_market@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'market', 'Furkan Market', 'Ankara', 'Cankaya', TRUE),
(3, 'eren_market@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'market', 'Eren Grocery', 'Ankara', 'Bahcelievler', TRUE),
(4, 'oguz_market@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'market', 'Oguz Gross', 'Istanbul', 'Besiktas', TRUE);

-- CONSUMERS (ID: 5-8)
INSERT INTO users (id, email, password, role, name, city, district, is_verified) VALUES
(5, 'omer_customer@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'consumer', 'Omer Cakir', 'Ankara', 'Bilkent', TRUE),
(6, 'furkan_customer@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'consumer', 'Furkan Yilmaz', 'Ankara', 'Cankaya', TRUE),
(7, 'eren_customer@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'consumer', 'Eren Kaya', 'Ankara', 'Bahcelievler', TRUE),
(8, 'oguz_customer@test.com', '$2b$10$8K1p/a0dL19v7GZOn5.uO.uF9vC6vPZJ8f1N7N/fE6BvK8B1vG5dy', 'consumer', 'Oguz Demir', 'Istanbul', 'Besiktas', TRUE);

-- PRODUCTS
INSERT INTO products (id, market_id, title, stock, normal_price, discounted_price, expiration_date, image_url) VALUES
(1, 1, 'Toblerone 100g', 25, 200.00, 120.00, '2026-05-22', 'placeholder.jpg'),
(2, 1, 'Coca Cola 1L', 10, 45.00, 30.00, '2026-05-10', 'placeholder.jpg'),
(3, 1, 'Milk 1L', 15, 35.00, 20.00, '2026-05-15', 'placeholder.jpg'),
(4, 1, 'Expired Yogurt', 2, 50.00, 10.00, '2024-01-01', 'placeholder.jpg');

-- SAMPLE CART
INSERT INTO carts (consumer_id, product_id, quantity) VALUES
(5, 1, 2),
(5, 2, 1);