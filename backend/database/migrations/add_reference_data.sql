-- Migration: reference-data tables (states + designations) with seed rows.
-- Idempotent — safe to run repeatedly on an existing database.

CREATE TABLE IF NOT EXISTS states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_ut TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS designations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

-- 28 states + 8 union territories (is_ut = 1 for UTs)
INSERT INTO states (name, is_ut) VALUES
  ('Andaman and Nicobar Islands', 1),
  ('Andhra Pradesh', 0),
  ('Arunachal Pradesh', 0),
  ('Assam', 0),
  ('Bihar', 0),
  ('Chandigarh', 1),
  ('Chhattisgarh', 0),
  ('Dadra and Nagar Haveli and Daman and Diu', 1),
  ('Delhi', 1),
  ('Goa', 0),
  ('Gujarat', 0),
  ('Haryana', 0),
  ('Himachal Pradesh', 0),
  ('Jammu and Kashmir', 1),
  ('Jharkhand', 0),
  ('Karnataka', 0),
  ('Kerala', 0),
  ('Ladakh', 1),
  ('Lakshadweep', 1),
  ('Madhya Pradesh', 0),
  ('Maharashtra', 0),
  ('Manipur', 0),
  ('Meghalaya', 0),
  ('Mizoram', 0),
  ('Nagaland', 0),
  ('Odisha', 0),
  ('Puducherry', 1),
  ('Punjab', 0),
  ('Rajasthan', 0),
  ('Sikkim', 0),
  ('Tamil Nadu', 0),
  ('Telangana', 0),
  ('Tripura', 0),
  ('Uttar Pradesh', 0),
  ('Uttarakhand', 0),
  ('West Bengal', 0)
ON DUPLICATE KEY UPDATE is_ut = VALUES(is_ut);

INSERT INTO designations (name, sort_order) VALUES
  ('Divisional Accountant', 1),
  ('Divisional Accounts Officer Grade-II', 2),
  ('Divisional Accounts Officer Grade-I', 3),
  ('Senior Divisional Accounts Officer', 4),
  ('Assistant Accounts Officer', 5),
  ('Accounts Officer', 6)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);
