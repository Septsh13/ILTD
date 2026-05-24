/**
 * ClearPath — Database Setup Script
 * Run this ONCE to create tables and seed test users:
 *   node scripts/setup-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to PostgreSQL...\n');

    // ── Enable UUID extension ────────────────────────────────────────────
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── ENUM TYPES ───────────────────────────────────────────────────────
    await client.query(`DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('CHA_AGENT', 'GOVT_OFFICIAL', 'ADMIN');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    await client.query(`DO $$ BEGIN
      CREATE TYPE shipment_status AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUSPICIOUS');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    await client.query(`DO $$ BEGIN
      CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    await client.query(`DO $$ BEGIN
      CREATE TYPE complaint_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    await client.query(`DO $$ BEGIN
      CREATE TYPE rejection_reason AS ENUM (
        'INCOMPLETE_DOCUMENTATION','POLICY_VIOLATION','DUPLICATE_SUBMISSION',
        'FRAUDULENT_CLAIM','MISSING_SIGNATURE'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    console.log('✅ Enum types ready');

    // ── TABLES ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id   VARCHAR(50)  NOT NULL UNIQUE,
        full_name     VARCHAR(150) NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role          user_role    NOT NULL,
        is_flagged    BOOLEAN      NOT NULL DEFAULT FALSE,
        is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cha_agents (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_number VARCHAR(100) NOT NULL UNIQUE,
        agency_name    VARCHAR(200) NOT NULL,
        contact_phone  VARCHAR(20),
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS govt_officials (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department  VARCHAR(150) NOT NULL,
        designation VARCHAR(150) NOT NULL,
        office_code VARCHAR(50)  NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
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
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
        shipment_id     UUID            NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
        uploaded_by     UUID            NOT NULL REFERENCES users(id),
        document_type   VARCHAR(100)    NOT NULL,
        file_name       VARCHAR(255)    NOT NULL,
        file_url        TEXT            NOT NULL,
        status          document_status NOT NULL DEFAULT 'PENDING',
        assigned_to     UUID            REFERENCES users(id),
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS document_actions (
        id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id      UUID             NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        acted_by         UUID             NOT NULL REFERENCES users(id),
        action           document_status  NOT NULL,
        rejection_reason rejection_reason,
        notes            TEXT,
        created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        cha_user_id     UUID         NOT NULL REFERENCES users(id),
        govt_user_id    UUID         NOT NULL REFERENCES users(id),
        shipment_id     UUID         REFERENCES shipments(id),
        subject         VARCHAR(255) NOT NULL,
        message         TEXT         NOT NULL,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
        tracking_token  VARCHAR(64)      NOT NULL UNIQUE,
        subject         VARCHAR(255)     NOT NULL,
        description     TEXT             NOT NULL,
        related_user_id UUID             REFERENCES users(id),
        status          complaint_status NOT NULL DEFAULT 'OPEN',
        admin_notes     TEXT,
        created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS complaint_identity (
        id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
        complaint_id    UUID        NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
        encrypted_name  TEXT        NOT NULL,
        encrypted_email TEXT        NOT NULL,
        encrypted_phone TEXT,
        iv              VARCHAR(64) NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID         REFERENCES users(id),
        role        user_role,
        action      VARCHAR(255) NOT NULL,
        status_code INTEGER      NOT NULL,
        metadata    JSONB,
        ip_address  VARCHAR(50),
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    console.log('✅ Tables ready\n');

    // ── SEED USERS ───────────────────────────────────────────────────────
    const ADMIN_PASS  = 'Admin@123';
    const TEST_PASS   = 'Test@1234';

    const adminHash = await bcrypt.hash(ADMIN_PASS, 12);
    const testHash  = await bcrypt.hash(TEST_PASS, 12);

    const users = [
      { employee_id: 'ADMIN001', full_name: 'System Administrator', email: 'admin@clearpath.gov',   role: 'ADMIN',        hash: adminHash },
      { employee_id: 'CHA001',   full_name: 'Arjun Mehta',          email: 'cha001@clearpath.gov',  role: 'CHA_AGENT',    hash: testHash  },
      { employee_id: 'CHA002',   full_name: 'Ravi Kumar',            email: 'cha002@clearpath.gov',  role: 'CHA_AGENT',    hash: testHash  },
      { employee_id: 'GOVT001',  full_name: 'Priya Sharma',          email: 'govt001@clearpath.gov', role: 'GOVT_OFFICIAL', hash: testHash },
      { employee_id: 'GOVT002',  full_name: 'Sneha Iyer',            email: 'govt002@clearpath.gov', role: 'GOVT_OFFICIAL', hash: testHash },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (employee_id, full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (employee_id) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               full_name     = EXCLUDED.full_name`,
        [u.employee_id, u.full_name, u.email, u.hash, u.role]
      );
      console.log(`   👤 ${u.role.padEnd(14)} ${u.employee_id}`);
    }

    // ── CHA agent profiles ────────────────────────────────────────────────
    for (const [empId, license, agency] of [
      ['CHA001', 'CHA-LIC-2026-001', 'Mehta Clearing Agency'],
      ['CHA002', 'CHA-LIC-2026-002', 'Kumar Logistics Pvt Ltd'],
    ]) {
      await client.query(
        `INSERT INTO cha_agents (user_id, license_number, agency_name)
         SELECT id, $2, $3 FROM users WHERE employee_id = $1
         ON CONFLICT (license_number) DO NOTHING`,
        [empId, license, agency]
      );
    }

    // ── Govt official profiles ────────────────────────────────────────────
    for (const [empId, dept, desig, code] of [
      ['GOVT001', 'Customs & Border Protection', 'Senior Inspector',  'NHAVA-SHEVA-01'],
      ['GOVT002', 'Ministry of Commerce',        'Document Reviewer', 'MUMBAI-PORT-02'],
    ]) {
      await client.query(
        `INSERT INTO govt_officials (user_id, department, designation, office_code)
         SELECT id, $2, $3, $4 FROM users WHERE employee_id = $1
         ON CONFLICT DO NOTHING`,
        [empId, dept, desig, code]
      );
    }

    console.log('\n✅ All users seeded!\n');
    console.log('┌──────────────────────────────────────────────┐');
    console.log('│           LOGIN CREDENTIALS                  │');
    console.log('├──────────────┬──────────────────────────────┤');
    console.log('│ ADMIN001     │ Admin@123                    │');
    console.log('│ CHA001/CHA002│ Test@1234                    │');
    console.log('│ GOVT001/002  │ Test@1234                    │');
    console.log('└──────────────┴──────────────────────────────┘');
    console.log('\n🚀 Open http://localhost:5173 and log in!\n');

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
