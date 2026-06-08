-- ============================================================
-- Migration 013: Companies + Profiles Production Schema
-- Clean SaaS multi-tenant structure
-- ============================================================

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- COMPANIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If companies already existed (from prior migrations), add new columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: migrate created_by → owner_id if created_by exists (added by migration 012)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'created_by'
  ) THEN
    UPDATE companies SET owner_id = created_by WHERE owner_id IS NULL AND created_by IS NOT NULL;
    ALTER TABLE companies DROP COLUMN IF EXISTS created_by;
  END IF;
END;
$$;

-- Backfill: set owner_id for existing rows that lack it
DO $$
DECLARE
  v_first_user UUID;
BEGIN
  UPDATE companies SET owner_id = (
    SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
  ) WHERE owner_id IS NULL;
END;
$$;

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  display_name TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If profiles already existed, add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMPANIES: CHECK CONSTRAINTS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_name_check'
  ) THEN
    ALTER TABLE companies
    ADD CONSTRAINT companies_name_check
    CHECK (char_length(trim(name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_slug_check'
  ) THEN
    ALTER TABLE companies
    ADD CONSTRAINT companies_slug_check
    CHECK (slug ~ '^[a-z0-9-]+$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_slug_unique'
  ) THEN
    ALTER TABLE companies
    ADD CONSTRAINT companies_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- ============================================================
-- PROFILES: CHECK CONSTRAINT
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('owner', 'admin', 'member'));
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- UPDATE create_company_and_profile to use owner_id
-- ============================================================

CREATE OR REPLACE FUNCTION create_company_and_profile(company_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));

  SELECT company_id INTO v_company_id FROM profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_company_id;
  END IF;

  INSERT INTO companies (name, owner_id)
  VALUES (company_name, auth.uid())
  RETURNING id INTO v_company_id;

  INSERT INTO profiles (id, company_id, role)
  VALUES (auth.uid(), v_company_id, 'owner');

  RETURN v_company_id;
END;
$$;

-- ============================================================
-- COMPANIES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select"
ON companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update"
ON companies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "companies_delete" ON companies;
CREATE POLICY "companies_delete"
ON companies
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ============================================================
-- PROFILES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete"
ON profiles
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- ============================================================
-- CLEANUP: Drop old policies from previous migrations
-- ============================================================

DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON companies;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
