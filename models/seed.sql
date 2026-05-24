-- GSN - Global Success Network seed data
-- Run after models/schema.sql:
--   psql -U postgres -d gsn_network_db -f models/seed.sql

-- Password for all seeded users: 123456
-- bcrypt hash generated with cost 12.

INSERT INTO chapters (name, city, region, country)
VALUES
  ('Mumbai Bay', 'Mumbai', 'India - West', 'India'),
  ('Delhi Achievers', 'Delhi', 'India - North', 'India'),
  ('Bangalore Elite', 'Bengaluru', 'India - South', 'India')
ON CONFLICT (name) DO UPDATE SET
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  country = EXCLUDED.country;

INSERT INTO users
  (employee_id, full_name, email, password_hash, role, member_category, region, chapter_id, total_referrals, business_generated_inr)
VALUES
  ('admin', 'Global Admin', 'admin@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'ADMIN', 'Leadership', 'Global', NULL, 156, 4875000),
  ('CP1', 'Alex Morgan', 'alex.morgan@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'CHAPTER_PRESIDENT', 'Digital Marketing Consultant', 'India - West', (SELECT id FROM chapters WHERE name = 'Mumbai Bay'), 128, 2475000),
  ('CP2', 'Priya Nair', 'priya.nair@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'CHAPTER_PRESIDENT', 'Financial Advisor', 'India - North', (SELECT id FROM chapters WHERE name = 'Delhi Achievers'), 112, 3620000)
ON CONFLICT (employee_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  member_category = EXCLUDED.member_category,
  region = EXCLUDED.region,
  chapter_id = EXCLUDED.chapter_id,
  total_referrals = EXCLUDED.total_referrals,
  business_generated_inr = EXCLUDED.business_generated_inr,
  status = 'ACTIVE',
  is_active = TRUE;

UPDATE chapters
SET president_id = (SELECT id FROM users WHERE employee_id = 'CP1')
WHERE name = 'Mumbai Bay';

UPDATE chapters
SET president_id = (SELECT id FROM users WHERE employee_id = 'CP2')
WHERE name = 'Delhi Achievers';

INSERT INTO users
  (employee_id, full_name, email, password_hash, role, member_category, region, chapter_id, president_id, total_referrals, business_generated_inr)
VALUES
  ('user', 'Normal User', 'user@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'NORMAL_USER', 'Business Consultant', 'India - West', (SELECT id FROM chapters WHERE name = 'Mumbai Bay'), (SELECT id FROM users WHERE employee_id = 'CP1'), 42, 875000),
  ('USR002', 'Rohan Mehta', 'rohan.mehta@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'NORMAL_USER', 'Financial Advisor', 'India - West', (SELECT id FROM chapters WHERE name = 'Mumbai Bay'), (SELECT id FROM users WHERE employee_id = 'CP1'), 48, 1820000),
  ('USR003', 'Kavita Singh', 'kavita.singh@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'NORMAL_USER', 'Business Consultant', 'India - West', (SELECT id FROM chapters WHERE name = 'Mumbai Bay'), (SELECT id FROM users WHERE employee_id = 'CP1'), 34, 1260000),
  ('USR004', 'Amitabh Verma', 'amitabh.verma@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'NORMAL_USER', 'Real Estate', 'India - South', (SELECT id FROM chapters WHERE name = 'Bangalore Elite'), NULL, 98, 2850000),
  ('USR005', 'Neha Kapoor', 'neha.kapoor@gsn.network', '\$2a\$12\$Uu.PQp2OJmwI9ZlpIpYXLODXdaj6xRvEWEDqK9iBnu0t4MRTHzD2G', 'NORMAL_USER', 'Marketing Specialist', 'India - West', (SELECT id FROM chapters WHERE name = 'Mumbai Bay'), (SELECT id FROM users WHERE employee_id = 'CP1'), 89, 2510000)
ON CONFLICT (employee_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  member_category = EXCLUDED.member_category,
  region = EXCLUDED.region,
  chapter_id = EXCLUDED.chapter_id,
  president_id = EXCLUDED.president_id,
  total_referrals = EXCLUDED.total_referrals,
  business_generated_inr = EXCLUDED.business_generated_inr,
  status = 'ACTIVE',
  is_active = TRUE;

INSERT INTO meetings (chapter_id, title, description, meeting_type, location, meeting_link, starts_at, status, created_by)
SELECT c.id, 'Global Leadership Summit', 'Leadership and chapter growth planning.', 'Online', 'Zoom', 'https://meet.gsn.network/global-leadership', NOW() + INTERVAL '5 days', 'UPCOMING', u.id
FROM chapters c
JOIN users u ON u.employee_id = 'admin'
WHERE c.name = 'Mumbai Bay'
AND NOT EXISTS (SELECT 1 FROM meetings WHERE title = 'Global Leadership Summit');

INSERT INTO meetings (chapter_id, title, description, meeting_type, location, meeting_link, starts_at, status, created_by)
SELECT c.id, 'Business Growth Workshop', 'Referral strategies and member growth workshop.', 'Offline', 'Mumbai Bay Chapter', NULL, NOW() + INTERVAL '16 days', 'UPCOMING', u.id
FROM chapters c
JOIN users u ON u.employee_id = 'CP1'
WHERE c.name = 'Mumbai Bay'
AND NOT EXISTS (SELECT 1 FROM meetings WHERE title = 'Business Growth Workshop');

INSERT INTO meetings (chapter_id, title, description, meeting_type, location, meeting_link, starts_at, status, created_by)
SELECT c.id, 'Networking Night', 'Chapter networking and introduction round.', 'Offline', 'Mumbai Bay Chapter', NULL, NOW() + INTERVAL '29 days', 'UPCOMING', u.id
FROM chapters c
JOIN users u ON u.employee_id = 'CP1'
WHERE c.name = 'Mumbai Bay'
AND NOT EXISTS (SELECT 1 FROM meetings WHERE title = 'Networking Night');

INSERT INTO referrals (from_user_id, to_user_id, title, amount_inr, status)
SELECT u1.id, u2.id, 'Strategic business referral', 875000, 'WON'
FROM users u1
JOIN users u2 ON u2.employee_id = 'USR002'
WHERE u1.employee_id = 'user'
AND NOT EXISTS (
  SELECT 1 FROM referrals WHERE title = 'Strategic business referral'
);
