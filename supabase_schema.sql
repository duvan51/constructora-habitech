-- SQL Schema for Habitech Constructor
-- Copy and paste this script inside the Supabase SQL Editor to initialize your database tables.

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  location JSONB NOT NULL DEFAULT '{"lat": 6.2518, "lng": -75.5636, "address": "Medellín, Colombia"}'::jsonb,
  status TEXT NOT NULL DEFAULT 'planning',
  total_cost NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  progress INTEGER NOT NULL DEFAULT 0,
  budget_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Ledger Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income' | 'expense'
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Documents Table (contracts, receipt scans)
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_base64 TEXT NOT NULL,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 4. Create Gallery Table (timeline photos and videos)
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  file_base64 TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' | 'video'
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Create Users Table (email, 4-digit pin, role permission)
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  pin TEXT NOT NULL, -- 4 digit number pin
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin' | 'editor' | 'viewer'
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Row Level Security) and configure permissive policies
-- This allows the frontend to insert, select, update, and delete data out-of-the-box.

-- Projects Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public SELECT projects" ON projects;
DROP POLICY IF EXISTS "Public INSERT projects" ON projects;
DROP POLICY IF EXISTS "Public UPDATE projects" ON projects;
DROP POLICY IF EXISTS "Public DELETE projects" ON projects;
CREATE POLICY "Public SELECT projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public INSERT projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public UPDATE projects" ON projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public DELETE projects" ON projects FOR DELETE USING (true);

-- Transactions Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public SELECT transactions" ON transactions;
DROP POLICY IF EXISTS "Public INSERT transactions" ON transactions;
DROP POLICY IF EXISTS "Public UPDATE transactions" ON transactions;
DROP POLICY IF EXISTS "Public DELETE transactions" ON transactions;
CREATE POLICY "Public SELECT transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public INSERT transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public UPDATE transactions" ON transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public DELETE transactions" ON transactions FOR DELETE USING (true);

-- Documents Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public SELECT documents" ON documents;
DROP POLICY IF EXISTS "Public INSERT documents" ON documents;
DROP POLICY IF EXISTS "Public UPDATE documents" ON documents;
DROP POLICY IF EXISTS "Public DELETE documents" ON documents;
CREATE POLICY "Public SELECT documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Public INSERT documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public UPDATE documents" ON documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public DELETE documents" ON documents FOR DELETE USING (true);

-- Gallery Policies
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public SELECT gallery" ON gallery;
DROP POLICY IF EXISTS "Public INSERT gallery" ON gallery;
DROP POLICY IF EXISTS "Public UPDATE gallery" ON gallery;
DROP POLICY IF EXISTS "Public DELETE gallery" ON gallery;
CREATE POLICY "Public SELECT gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Public INSERT gallery" ON gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Public UPDATE gallery" ON gallery FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public DELETE gallery" ON gallery FOR DELETE USING (true);

-- Users Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public SELECT users" ON users;
DROP POLICY IF EXISTS "Public INSERT users" ON users;
DROP POLICY IF EXISTS "Public UPDATE users" ON users;
DROP POLICY IF EXISTS "Public DELETE users" ON users;
CREATE POLICY "Public SELECT users" ON users FOR SELECT USING (true);
CREATE POLICY "Public INSERT users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public UPDATE users" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public DELETE users" ON users FOR DELETE USING (true);

-- Seed default administrator (PIN: 1234)
INSERT INTO users (email, pin, role, name)
VALUES ('constructorahabitecsas@gmail.com', '1234', 'admin', 'Habitech Admin')
ON CONFLICT (email) DO NOTHING;
