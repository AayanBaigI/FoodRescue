-- Demo locations
INSERT INTO locations (name, address, latitude, longitude) VALUES
('Campus Canteen', 'NIT Durgapur Campus', 23.520400, 87.311900),
('City Community Kitchen', 'Durgapur, West Bengal', 23.547600, 87.289500);

-- Demo users. Password hashes correspond to the demo password:
-- password123
INSERT INTO users (name, email, password_hash, role) VALUES
('Demo Provider', 'provider@foodrescue.test', '$2a$10$wH2u9hNQn6G3nH5pZ4ZQ8e4J4jX1K9y0rV7W0oQ4H3w3m5cY2L5eK', 'PROVIDER'),
('Demo NGO', 'ngo@foodrescue.test', '$2a$10$wH2u9hNQn6G3nH5pZ4ZQ8e4J4jX1K9y0rV7W0oQ4H3w3m5cY2L5eK', 'NGO');

INSERT INTO donations
(provider_id, food_name, category, quantity, remaining_quantity, location_id, prepared_at, expiry_at)
VALUES
(1, 'Vegetable Biryani', 'Cooked Meals', 40, 40, 1, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours'),
(1, 'Packed Sandwiches', 'Bakery', 25, 25, 2, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '5 hours');
