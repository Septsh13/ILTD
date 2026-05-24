-- GSN - Global Success Network PostgreSQL schema
-- Target database: gsn_network_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('ADMIN', 'CHAPTER_PRESIDENT', 'NORMAL_USER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
CREATE TYPE meeting_status AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');
CREATE TYPE referral_status AS ENUM ('OPEN', 'WON', 'LOST');
CREATE TYPE import_status AS ENUM ('STARTED', 'COMPLETED', 'FAILED');

CREATE TABLE users (
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
);

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL UNIQUE,
  city VARCHAR(120) NOT NULL,
  region VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL DEFAULT 'India',
  president_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  import_key VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT users_chapter_id_fkey
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL;

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  amount_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status referral_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meetings (
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
);

CREATE TABLE meeting_attendees (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE chapter_analytics (
  chapter_id UUID PRIMARY KEY REFERENCES chapters(id) ON DELETE CASCADE,
  reported_member_count INTEGER NOT NULL DEFAULT 0,
  total_business_generated_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_referrals_generated INTEGER NOT NULL DEFAULT 0,
  total_meetings_conducted INTEGER NOT NULL DEFAULT 0,
  source_import_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_logs (
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
);

CREATE TABLE import_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_log_id UUID NOT NULL REFERENCES import_logs(id) ON DELETE CASCADE,
  row_number INTEGER,
  message TEXT NOT NULL,
  row_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_source_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_key VARCHAR(120) NOT NULL,
  row_number INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  row_hash VARCHAR(64) NOT NULL,
  raw_data JSONB NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (import_key, row_number)
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  security_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  account_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  language_preference VARCHAR(40) NOT NULL DEFAULT 'English',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role user_role,
  action VARCHAR(255) NOT NULL,
  status_code INTEGER NOT NULL,
  metadata JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_chapter_id ON users(chapter_id);
CREATE INDEX idx_users_president_id ON users(president_id);
CREATE INDEX idx_users_import_key ON users(import_key);
CREATE INDEX idx_chapters_president_id ON chapters(president_id);
CREATE INDEX idx_import_logs_started_at ON import_logs(started_at DESC);
CREATE INDEX idx_import_source_rows_import_key ON import_source_rows(import_key);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
