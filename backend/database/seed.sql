USE company_db;

INSERT INTO forms (id, form_id, name, sections, states, status, survey_year, description, created_by, created_date, updated_by, updated_date)
VALUES
  (1, 'GAW-2026-001', 'IT Systems Survey 2026-27',
   '["ifmis","ehrms","wamis","evoucher"]',
   '["Maharashtra","Karnataka","Uttar Pradesh"]',
   'published', '2026-27', 'Annual IT systems access survey for all A&E offices.',
   NULL, NOW(), NULL, NOW()),
  (2, 'GAW-2026-002', 'WAMIS Status Check',
   '["wamis","evoucher"]', '[]', 'draft', '2026-27', 'Focus survey on WAMIS rollout status.',
   NULL, NOW(), NULL, NOW()),
  (3, 'GAW-2025-003', 'e-HRMS Access Review',
   '["ehrms"]', '["Telangana"]', 'review', '2025-26',
   'e-HRMS integration status across southern states.',
   NULL, NOW(), NULL, NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_by = VALUES(updated_by), updated_date = VALUES(updated_date);

-- ── Reference data: states + designations ──────────────────
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
