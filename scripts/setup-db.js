/**
 * GSN - idempotent development database setup.
 * Creates missing schema objects and upserts default testing accounts.
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function ensureEnum(client, name, values) {
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN
        CREATE TYPE ${name} AS ENUM (${values.map((value) => `'${value}'`).join(', ')});
      END IF;
    END $$;
  `);
}

async function setup() {
  const client = await pool.connect();

  try {
    console.log(`Connected to PostgreSQL database: ${process.env.DB_NAME}\n`);

    await client.query('BEGIN');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await ensureEnum(client, 'user_role', ['ADMIN', 'CHAPTER_PRESIDENT', 'NORMAL_USER']);
    await ensureEnum(client, 'user_status', ['ACTIVE', 'INVITED', 'SUSPENDED']);
    await ensureEnum(client, 'meeting_status', ['UPCOMING', 'COMPLETED', 'CANCELLED']);
    await ensureEnum(client, 'referral_status', ['OPEN', 'WON', 'LOST']);
    await ensureEnum(client, 'import_status', ['STARTED', 'COMPLETED', 'FAILED']);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        status user_status NOT NULL DEFAULT 'ACTIVE',
        member_category VARCHAR(120),
        chapter_designation VARCHAR(120),
        company_name VARCHAR(180),
        company_designation VARCHAR(150),
        company_location VARCHAR(150),
        region VARCHAR(120),
        chapter_id UUID,
        president_id UUID REFERENCES users(id) ON DELETE SET NULL,
        total_referrals INTEGER NOT NULL DEFAULT 0,
        referrals_received INTEGER NOT NULL DEFAULT 0,
        business_generated_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
        meetings_attended INTEGER NOT NULL DEFAULT 0,
        import_key VARCHAR(120),
        phone VARCHAR(30),
        age INTEGER,
        gender VARCHAR(40),
        bio TEXT,
        profile_image_url TEXT,
        is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const statement of [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(40)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS chapter_designation VARCHAR(120)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(180)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_designation VARCHAR(150)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_location VARCHAR(150)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals_received INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS meetings_attended INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS import_key VARCHAR(120)`,
    ]) {
      await client.query(statement);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL UNIQUE,
        city VARCHAR(120) NOT NULL,
        region VARCHAR(120) NOT NULL,
        country VARCHAR(120) NOT NULL DEFAULT 'India',
        president_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
        import_key VARCHAR(120),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS import_key VARCHAR(120)`);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'users_chapter_id_fkey'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_chapter_id_fkey
          FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(180) NOT NULL,
        amount_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
        status referral_status NOT NULL DEFAULT 'OPEN',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
        title VARCHAR(180) NOT NULL,
        description TEXT,
        meeting_type VARCHAR(80) NOT NULL DEFAULT 'Online',
        location VARCHAR(255),
        meeting_link TEXT,
        starts_at TIMESTAMPTZ NOT NULL,
        status meeting_status NOT NULL DEFAULT 'UPCOMING',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const statement of [
      `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
      `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_link TEXT`,
      `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL`,
      `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    ]) {
      await client.query(statement);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_attendees (
        meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (meeting_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chapter_analytics (
        chapter_id UUID PRIMARY KEY REFERENCES chapters(id) ON DELETE CASCADE,
        reported_member_count INTEGER NOT NULL DEFAULT 0,
        total_business_generated_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total_referrals_generated INTEGER NOT NULL DEFAULT 0,
        total_meetings_conducted INTEGER NOT NULL DEFAULT 0,
        source_import_id UUID,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_key VARCHAR(120) NOT NULL,
        source_filename TEXT NOT NULL,
        status import_status NOT NULL DEFAULT 'STARTED',
        total_rows INTEGER NOT NULL DEFAULT 0,
        valid_rows INTEGER NOT NULL DEFAULT 0,
        invalid_rows INTEGER NOT NULL DEFAULT 0,
        inserted_users INTEGER NOT NULL DEFAULT 0,
        updated_users INTEGER NOT NULL DEFAULT 0,
        inserted_chapters INTEGER NOT NULL DEFAULT 0,
        updated_chapters INTEGER NOT NULL DEFAULT 0,
        started_by UUID REFERENCES users(id) ON DELETE SET NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        error_message TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS import_errors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_log_id UUID NOT NULL REFERENCES import_logs(id) ON DELETE CASCADE,
        row_number INTEGER,
        message TEXT NOT NULL,
        row_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS import_source_rows (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_key VARCHAR(120) NOT NULL,
        row_number INTEGER NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
        row_hash VARCHAR(64) NOT NULL,
        raw_data JSONB NOT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (import_key, row_number)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        privacy_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        security_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        account_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        language_preference VARCHAR(40) NOT NULL DEFAULT 'English',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        role user_role,
        action VARCHAR(255) NOT NULL,
        status_code INTEGER NOT NULL,
        metadata JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_chapter_id ON users(chapter_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_president_id ON users(president_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_import_key ON users(import_key)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chapters_president_id ON chapters(president_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_import_logs_started_at ON import_logs(started_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_import_source_rows_import_key ON import_source_rows(import_key)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`);

    const adminHash = await bcrypt.hash('123456', 12);
    const testHash = await bcrypt.hash('123456', 12);

    await client.query(`
      INSERT INTO chapters (name, city, region)
      VALUES ('Sample GSN Chapter', 'Mumbai', 'India - West')
      ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city, region = EXCLUDED.region
    `);

    await client.query(`
      UPDATE chapters
      SET president_id = NULL
      WHERE president_id IN (
        SELECT id FROM users
        WHERE email IN ('admin@gsn.network', 'cp1@gsn.network', 'user@gsn.network')
        AND employee_id NOT IN ('admin', 'CP1', 'user')
      )
    `);

    await client.query(`
      DELETE FROM users
      WHERE email IN ('admin@gsn.network', 'cp1@gsn.network', 'user@gsn.network')
      AND employee_id NOT IN ('admin', 'CP1', 'user')
    `);

    await client.query(`
      UPDATE chapters
      SET president_id = NULL
      WHERE name IN ('Mumbai Bay', 'Bangalore Elite', 'Delhi Achievers', 'Pune Progressors')
    `);

    await client.query(`
      DELETE FROM users
      WHERE employee_id IN ('ADMIN001', 'CP001', 'CP002', 'USER001', 'USER002', 'USER003', 'USER004', 'USER005')
    `);

    await client.query(`
      DELETE FROM chapters
      WHERE name IN ('Mumbai Bay', 'Bangalore Elite', 'Delhi Achievers', 'Pune Progressors')
    `);

    await client.query(`
      DELETE FROM meetings
      WHERE title IN (
        'Global Leadership Summit',
        'Business Growth Workshop',
        'Networking Night',
        'Referral Introduction'
      )
      OR chapter_id IS NULL
    `);

    const seedUsers = [
      ['admin', 'Global Admin', 'admin@gsn.network', 'ADMIN', 'Leadership', 'Global', null, null, adminHash, 156, 4875000],
      ['CP1', 'Chapter President CP1', 'cp1@gsn.network', 'CHAPTER_PRESIDENT', 'Chapter Leadership', 'India - West', 'Sample GSN Chapter', null, testHash, 128, 2475000],
      ['user', 'Normal User', 'user@gsn.network', 'NORMAL_USER', 'Business Consultant', 'India - West', 'Sample GSN Chapter', 'CP1', testHash, 42, 875000],
    ];

    for (const [employeeId, fullName, email, role, category, region, chapterName, presidentEmployeeId, hash, referrals, business] of seedUsers) {
      await client.query(`
        INSERT INTO users
          (employee_id, full_name, email, password_hash, role, member_category, region,
           chapter_id, president_id, total_referrals, business_generated_inr)
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          (SELECT id FROM chapters WHERE name = $8),
          (SELECT id FROM users WHERE employee_id = $9),
          $10, $11
        )
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
          is_active = TRUE,
          status = 'ACTIVE'
      `, [employeeId, fullName, email, hash, role, category, region, chapterName, presidentEmployeeId, referrals, business]);
    }

    await client.query(`
      UPDATE chapters
      SET president_id = (SELECT id FROM users WHERE employee_id = 'CP1')
      WHERE name = 'Sample GSN Chapter'
    `);

    await client.query(`
      INSERT INTO meetings (chapter_id, title, description, meeting_type, location, meeting_link, starts_at, status, created_by)
      SELECT c.id, 'Sample Chapter Growth Meeting', 'Monthly business networking and referral review.', 'Online',
             'Google Meet', 'https://meet.google.com/sample-gsn', NOW() + INTERVAL '5 days', 'UPCOMING', u.id
      FROM chapters c
      JOIN users u ON u.employee_id = 'CP1'
      WHERE c.name = 'Sample GSN Chapter'
      AND NOT EXISTS (SELECT 1 FROM meetings WHERE title = 'Sample Chapter Growth Meeting')
    `);

    await client.query('COMMIT');

    console.log('GSN schema and seed data are ready.\n');
    console.log('LOGIN CREDENTIALS');
    console.log('admin / 123456');
    console.log('CP1   / 123456');
    console.log('user  / 123456');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
