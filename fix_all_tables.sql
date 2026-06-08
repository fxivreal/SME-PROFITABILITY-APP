-- ============================================================
-- FIX ALL REMAINING TABLES: add company_id + RLS policies
-- Run this ENTIRE script once in SQL Editor
-- ============================================================

-- === 1. Add company_id to all tables still missing it ===
ALTER TABLE bill_of_materials       ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE bill_of_materials_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE production_batches      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE batch_materials         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE sales                   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- === 2. Backfill existing rows ===
UPDATE bill_of_materials       SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1) WHERE company_id IS NULL;
UPDATE bill_of_materials_items SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1) WHERE company_id IS NULL;
UPDATE production_batches      SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1) WHERE company_id IS NULL;
UPDATE batch_materials         SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1) WHERE company_id IS NULL;
UPDATE sales                   SET company_id = (SELECT id FROM companies ORDER BY created_at ASC LIMIT 1) WHERE company_id IS NULL;

-- === 3. Make company_id NOT NULL ===
ALTER TABLE bill_of_materials       ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE bill_of_materials_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE production_batches      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE batch_materials         ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sales                   ALTER COLUMN company_id SET NOT NULL;

-- === 4. Drop old policies and create new company-scoped policies ===
DROP POLICY IF EXISTS "Enable all for anon"      ON bill_of_materials;
DROP POLICY IF EXISTS "Company-scoped access"    ON bill_of_materials;
CREATE POLICY "Company-scoped access" ON bill_of_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable all for anon"      ON bill_of_materials_items;
DROP POLICY IF EXISTS "Company-scoped access"    ON bill_of_materials_items;
CREATE POLICY "Company-scoped access" ON bill_of_materials_items
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable all for anon"      ON production_batches;
DROP POLICY IF EXISTS "Company-scoped access"    ON production_batches;
CREATE POLICY "Company-scoped access" ON production_batches
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable all for anon"      ON batch_materials;
DROP POLICY IF EXISTS "Company-scoped access"    ON batch_materials;
CREATE POLICY "Company-scoped access" ON batch_materials
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable all for anon"      ON sales;
DROP POLICY IF EXISTS "Company-scoped access"    ON sales;
CREATE POLICY "Company-scoped access" ON sales
  FOR ALL TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- === 5. Ensure RLS is enabled ===
ALTER TABLE bill_of_materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_materials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                   ENABLE ROW LEVEL SECURITY;
