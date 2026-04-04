-- ═══════════════════════════════════════════════════════════════════
--  ClearPath — Test Seed Data
--  Run AFTER schema.sql:
--    psql -U postgres -d clearpath_db -f models/seed.sql
-- ═══════════════════════════════════════════════════════════════════

-- ── Test Users ───────────────────────────────────────────────────────
-- All passwords are:  Test@1234
-- Bcrypt hash for "Test@1234" (cost 12):
--   $2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i

-- CHA Agent
INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'CHA001',
  'Arjun Mehta',
  'cha001@clearpath.gov',
  '$2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i',
  'CHA_AGENT'
) ON CONFLICT (employee_id) DO NOTHING;

-- Government Official
INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'GOVT001',
  'Priya Sharma',
  'govt001@clearpath.gov',
  '$2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i',
  'GOVT_OFFICIAL'
) ON CONFLICT (employee_id) DO NOTHING;

-- Second CHA Agent
INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'CHA002',
  'Ravi Kumar',
  'cha002@clearpath.gov',
  '$2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i',
  'CHA_AGENT'
) ON CONFLICT (employee_id) DO NOTHING;

-- Second Government Official
INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'GOVT002',
  'Sneha Iyer',
  'govt002@clearpath.gov',
  '$2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i',
  'GOVT_OFFICIAL'
) ON CONFLICT (employee_id) DO NOTHING;

-- CBI Agent (Complaints Bureau Investigator)
INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'CBI001',
  'Vikram Singh',
  'cbi001@clearpath.gov',
  '$2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i',
  'CBI'
) ON CONFLICT (employee_id) DO NOTHING;

-- Second CBI Agent
INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'CBI002',
  'Anjali Verma',
  'cbi002@clearpath.gov',
  '$2a$12$LHRLNasNqSh.y8BFQ1hZwe5b.5/nQY6jEjQGBPmKPXj8dGr8u9j8i',
  'CBI'
) ON CONFLICT (employee_id) DO NOTHING;

-- ── Profile records ─────────────────────────────────────────────────

INSERT INTO cha_agents (user_id, license_number, agency_name, contact_phone)
SELECT id, 'CHA-LIC-2026-001', 'Mehta Clearing Agency', '+91-9800000001'
FROM users WHERE employee_id = 'CHA001'
ON CONFLICT DO NOTHING;

INSERT INTO cha_agents (user_id, license_number, agency_name, contact_phone)
SELECT id, 'CHA-LIC-2026-002', 'Kumar Logistics Pvt Ltd', '+91-9800000002'
FROM users WHERE employee_id = 'CHA002'
ON CONFLICT DO NOTHING;

INSERT INTO govt_officials (user_id, department, designation, office_code)
SELECT id, 'Customs & Border Protection', 'Senior Inspector', 'NHAVA-SHEVA-01'
FROM users WHERE employee_id = 'GOVT001'
ON CONFLICT DO NOTHING;

INSERT INTO govt_officials (user_id, department, designation, office_code)
SELECT id, 'Ministry of Commerce', 'Document Reviewer', 'MUMBAI-PORT-02'
FROM users WHERE employee_id = 'GOVT002'
ON CONFLICT DO NOTHING;
