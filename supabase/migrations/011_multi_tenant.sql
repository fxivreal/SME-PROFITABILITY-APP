-- ============================================================
-- Migration 011: Multi-Tenant Data Isolation
-- Adds company_id to all data tables, creates SECURITY DEFINER
-- function, and updates RLS policies from anon to company-scoped.
-- ============================================================

-- 1. Add created_by to companies (for audit trail)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. SECURITY DEFINER function: atomically creates company + profile
--    Bypasses RLS so the INSERT works regardless of client auth context.
--    auth.uid() is extracted from the JWT in the HTTP request header,
--    which Supabase REST API always passes through.
CREATE OR REPLACE FUNCTION create_company_and_profile(company_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Idempotent: return existing company if user already has a profile
  SELECT company_id INTO v_company_id FROM profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_company_id;
  END IF;

  INSERT INTO companies (name, created_by)
  VALUES (company_name, auth.uid())
  RETURNING id INTO v_company_id;

  INSERT INTO profiles (id, company_id, role)
  VALUES (auth.uid(), v_company_id, 'owner');

  RETURN v_company_id;
END;
$$;

-- 3. Add company_id to all existing data tables
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE finished_goods ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE bill_of_materials ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE bill_of_materials_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE batch_materials ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 4. Backfill: create a default company and assign all existing data to it.
--    Uses a subquery to only backfill rows that don't already have a company_id.
DO $$
DECLARE
  v_default_company_id UUID;
  v_owner_id UUID;
BEGIN
  -- Use the first admin user as the owner, or NULL if no users exist
  SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- Create a default company if one doesn't already exist
  INSERT INTO companies (name, created_by)
  SELECT 'Default Company', v_owner_id
  WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1)
  RETURNING id INTO v_default_company_id;

  -- If a company already exists, use the first one
  IF v_default_company_id IS NULL THEN
    SELECT id INTO v_default_company_id FROM companies ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Backfill all data tables
  IF v_default_company_id IS NOT NULL THEN
    UPDATE raw_materials SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE finished_goods SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE bill_of_materials SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE bill_of_materials_items SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE production_batches SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE batch_materials SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE sales SET company_id = v_default_company_id WHERE company_id IS NULL;

    -- Also create a profile for the owner if one doesn't exist
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO profiles (id, company_id, role)
      VALUES (v_owner_id, v_default_company_id, 'owner')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- 5. Make company_id NOT NULL after backfill
ALTER TABLE raw_materials ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE finished_goods ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE bill_of_materials ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE bill_of_materials_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE production_batches ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE batch_materials ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;

-- 6. Drop old "anon" policies and create company-scoped policies

-- Helper: company_id check (reused across all tables)
-- A user can access a row if their profile's company_id matches the row's company_id

-- raw_materials
DROP POLICY IF EXISTS "Enable all for anon" ON raw_materials;
CREATE POLICY "Company-scoped access" ON raw_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- finished_goods
DROP POLICY IF EXISTS "Enable all for anon" ON finished_goods;
CREATE POLICY "Company-scoped access" ON finished_goods
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- bill_of_materials
DROP POLICY IF EXISTS "Enable all for anon" ON bill_of_materials;
CREATE POLICY "Company-scoped access" ON bill_of_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- bill_of_materials_items
DROP POLICY IF EXISTS "Enable all for anon" ON bill_of_materials_items;
CREATE POLICY "Company-scoped access" ON bill_of_materials_items
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- production_batches
DROP POLICY IF EXISTS "Enable all for anon" ON production_batches;
CREATE POLICY "Company-scoped access" ON production_batches
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- batch_materials
DROP POLICY IF EXISTS "Enable all for anon" ON batch_materials;
CREATE POLICY "Company-scoped access" ON batch_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- sales
DROP POLICY IF EXISTS "Enable all for anon" ON sales;
CREATE POLICY "Company-scoped access" ON sales
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 7. Profile policies — only the user's own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- 8. Company policies — insert allowed for authenticated, select/update scoped to members
DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;

CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT TO authenticated
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own company" ON companies
  FOR UPDATE TO authenticated
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
