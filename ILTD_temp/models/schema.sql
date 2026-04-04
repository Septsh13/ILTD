-- ═══════════════════════════════════════════════════════════════════
--  ClearPath — PostgreSQL Schema
--  Run this file against your clearpath_db database:
--    psql -U YOUR_USERNAME -d clearpath_db -f models/schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM TYPES ────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('CHA_AGENT', 'GOVT_OFFICIAL', 'CBI', 'ADMIN');

CREATE TYPE shipment_status AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUSPICIOUS');

CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE complaint_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

CREATE TYPE rejection_reason AS ENUM (
  'INCOMPLETE_DOCUMENTATION',
  'POLICY_VIOLATION',
  'DUPLICATE_SUBMISSION',
  'FRAUDULENT_CLAIM',
  'MISSING_SIGNATURE'
);

-- ── TABLE: users ──────────────────────────────────────────────────────────────
-- Common authentication table for all roles

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   VARCHAR(50)  NOT NULL UNIQUE,   -- login identifier
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL,
  is_flagged    BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role        ON users(role);

-- ── TABLE: cha_agents ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cha_agents (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  agency_name    VARCHAR(200) NOT NULL,
  contact_phone  VARCHAR(20),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cha_agents_user_id ON cha_agents(user_id);

-- ── TABLE: govt_officials ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS govt_officials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department  VARCHAR(150) NOT NULL,
  designation VARCHAR(150) NOT NULL,
  office_code VARCHAR(50)  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_govt_officials_user_id ON govt_officials(user_id);

-- ── TABLE: shipments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shipments (
  id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  cha_user_id      UUID            NOT NULL REFERENCES users(id),
  tracking_number  VARCHAR(100)    NOT NULL UNIQUE,
  shipper_name     VARCHAR(200)    NOT NULL,
  consignee_name   VARCHAR(200)    NOT NULL,
  origin_port      VARCHAR(100)    NOT NULL,
  destination_port VARCHAR(100)    NOT NULL,
  cargo_description TEXT,
  gross_weight_kg  NUMERIC(12, 3),
  status           shipment_status NOT NULL DEFAULT 'PENDING',
  is_suspicious    BOOLEAN         NOT NULL DEFAULT FALSE,
  suspicious_note  TEXT,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_cha_user_id     ON shipments(cha_user_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status          ON shipments(status);

-- ── TABLE: documents ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id     UUID            NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  uploaded_by     UUID            NOT NULL REFERENCES users(id),
  document_type   VARCHAR(100)    NOT NULL,  -- e.g. 'BILL_OF_LADING', 'INVOICE'
  file_name       VARCHAR(255)    NOT NULL,
  file_url        TEXT            NOT NULL,
  status          document_status NOT NULL DEFAULT 'PENDING',
  assigned_to     UUID            REFERENCES users(id),  -- Govt official
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_shipment_id ON documents(shipment_id);
CREATE INDEX idx_documents_assigned_to ON documents(assigned_to);
CREATE INDEX idx_documents_status      ON documents(status);

-- ── TABLE: document_actions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS document_actions (
  id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id      UUID             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  acted_by         UUID             NOT NULL REFERENCES users(id),
  action           document_status  NOT NULL,            -- 'APPROVED' or 'REJECTED'
  rejection_reason rejection_reason,                    -- NULL when approved
  notes            TEXT,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_actions_document_id ON document_actions(document_id);
CREATE INDEX idx_document_actions_acted_by    ON document_actions(acted_by);

-- ── TABLE: interactions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interactions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  cha_user_id     UUID        NOT NULL REFERENCES users(id),
  govt_user_id    UUID        NOT NULL REFERENCES users(id),
  shipment_id     UUID        REFERENCES shipments(id),
  subject         VARCHAR(255) NOT NULL,
  message         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_cha_user_id  ON interactions(cha_user_id);
CREATE INDEX idx_interactions_govt_user_id ON interactions(govt_user_id);

-- ── TABLE: complaints ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS complaints (
  id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_token  VARCHAR(255)     NOT NULL UNIQUE, -- token given to complainant
  subject         VARCHAR(255)     NOT NULL,
  description     TEXT             NOT NULL,
  related_user_id UUID             REFERENCES users(id),  -- accused user (optional)
  status          complaint_status NOT NULL DEFAULT 'OPEN',
  admin_notes     TEXT,
  cbi_assigned_to UUID             REFERENCES users(id),  -- CBI officer assigned
  cbi_message     TEXT,                                   -- CBI investigative notes (hidden from CHA)
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_tracking_token ON complaints(tracking_token);
CREATE INDEX idx_complaints_status         ON complaints(status);
CREATE INDEX idx_complaints_cbi_assigned_to ON complaints(cbi_assigned_to);

-- ── TABLE: complaint_identity ─────────────────────────────────────────────────
-- Encrypted PII of the complainant — AES-256 encrypted at application layer

CREATE TABLE IF NOT EXISTS complaint_identity (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id        UUID        NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
  encrypted_name      TEXT        NOT NULL,   -- AES-256-CBC encrypted
  encrypted_email     TEXT        NOT NULL,   -- AES-256-CBC encrypted
  encrypted_phone     TEXT,                   -- AES-256-CBC encrypted (optional)
  iv                  VARCHAR(64) NOT NULL,   -- Initialization vector used for encryption
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TABLE: audit_logs ─────────────────────────────────────────────────────────
-- Append-only. No UPDATE or DELETE ever happens on this table.

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        REFERENCES users(id),  -- NULL for public/unauthenticated actions
  role        user_role,
  action      VARCHAR(255) NOT NULL,             -- e.g. 'POST /cha/shipments'
  status_code INTEGER      NOT NULL,
  metadata    JSONB,                             -- optional extra context
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);

-- ── UPDATE TRIGGER: updated_at ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── SEED: Default Admin User ──────────────────────────────────────────────────
-- Password: Admin@123 (bcrypt hash — change before production)
-- Employee ID: ADMIN001

INSERT INTO users (employee_id, full_name, email, password_hash, role)
VALUES (
  'ADMIN001',
  'System Administrator',
  'admin@clearpath.gov',
  '$2a$12$qV/7yYKozlu/qhVrXMzNOe3YCp80vKIHDJfYNJJwlqdcmTOp5dFA6',
  'ADMIN'
) ON CONFLICT (employee_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
