-- ============================================================
-- Migration 014: Fix RLS for ALL tables
-- Safe to run multiple times. Handles existing and missing columns.
-- Run this entire script in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. Ensure company_id exists on ALL data tables
-- ============================================================

ALTER TABLE raw_materials           ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN ALTER TABLE finished_goods ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); END IF; END; $$;
ALTER TABLE bill_of_materials       ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE bill_of_materials_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE production_batches      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE batch_materials         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE sales                   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ============================================================
-- 2. Backfill: assign existing rows to the first company
-- ============================================================

DO $$
DECLARE
  v_default_id UUID;
BEGIN
  SELECT id INTO v_default_id FROM companies ORDER BY created_at ASC LIMIT 1;

  IF v_default_id IS NOT NULL THEN
    UPDATE raw_materials           SET company_id = v_default_id WHERE company_id IS NULL;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN
      UPDATE finished_goods SET company_id = v_default_id WHERE company_id IS NULL;
    END IF;
    UPDATE bill_of_materials       SET company_id = v_default_id WHERE company_id IS NULL;
    UPDATE bill_of_materials_items SET company_id = v_default_id WHERE company_id IS NULL;
    UPDATE production_batches      SET company_id = v_default_id WHERE company_id IS NULL;
    UPDATE batch_materials         SET company_id = v_default_id WHERE company_id IS NULL;
    UPDATE sales                   SET company_id = v_default_id WHERE company_id IS NULL;
  END IF;
END;
$$;

-- ============================================================
-- 3. Make company_id NOT NULL after backfill
-- ============================================================

ALTER TABLE raw_materials           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE bill_of_materials       ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE bill_of_materials_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE production_batches      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE batch_materials         ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sales                   ALTER COLUMN company_id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN
    ALTER TABLE finished_goods ALTER COLUMN company_id SET NOT NULL;
  END IF;
END;
$$;

-- ============================================================
-- 4. DROP old anon-only policies (safe even if they don't exist)
-- ============================================================

DROP POLICY IF EXISTS "Enable all for anon"             ON raw_materials;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN DROP POLICY IF EXISTS "Enable all for anon" ON finished_goods; END IF; END; $$;
DROP POLICY IF EXISTS "Enable all for anon"             ON bill_of_materials;
DROP POLICY IF EXISTS "Enable all for anon"             ON bill_of_materials_items;
DROP POLICY IF EXISTS "Enable all for anon"             ON production_batches;
DROP POLICY IF EXISTS "Enable all for anon"             ON batch_materials;
DROP POLICY IF EXISTS "Enable all for anon"             ON sales;
DROP POLICY IF EXISTS "Users can insert companies"      ON companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Also drop any old policies from earlier migrations
DROP POLICY IF EXISTS "Company-scoped access"           ON raw_materials;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN DROP POLICY IF EXISTS "Company-scoped access" ON finished_goods; END IF; END; $$;
DROP POLICY IF EXISTS "Company-scoped access"           ON bill_of_materials;
DROP POLICY IF EXISTS "Company-scoped access"           ON bill_of_materials_items;
DROP POLICY IF EXISTS "Company-scoped access"           ON production_batches;
DROP POLICY IF EXISTS "Company-scoped access"           ON batch_materials;
DROP POLICY IF EXISTS "Company-scoped access"           ON sales;
DROP POLICY IF EXISTS "Users can insert companies"      ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- ============================================================
-- 5. Create authenticated-only company-scoped policies
-- ============================================================

-- raw_materials
CREATE POLICY "Company-scoped access" ON raw_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN
    EXECUTE 'CREATE POLICY "Company-scoped access" ON finished_goods
      FOR ALL TO authenticated
      USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))';
  END IF;
END;
$$;

-- bill_of_materials
CREATE POLICY "Company-scoped access" ON bill_of_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- bill_of_materials_items
CREATE POLICY "Company-scoped access" ON bill_of_materials_items
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- production_batches
CREATE POLICY "Company-scoped access" ON production_batches
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- batch_materials
CREATE POLICY "Company-scoped access" ON batch_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- sales
CREATE POLICY "Company-scoped access" ON sales
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- 6. Profile policies (own profile only)
-- ============================================================

CREATE POLICY "profile_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profile_select" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profile_update" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- ============================================================
-- 7. Company policies
-- ============================================================

CREATE POLICY "company_insert" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "company_select" ON companies
  FOR SELECT TO authenticated
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "company_update" ON companies
  FOR UPDATE TO authenticated
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ============================================================
-- 8. Ensure RLS is enabled on all tables
-- ============================================================

ALTER TABLE raw_materials           ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finished_goods') THEN ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY; END IF; END; $$;
ALTER TABLE bill_of_materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_materials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
