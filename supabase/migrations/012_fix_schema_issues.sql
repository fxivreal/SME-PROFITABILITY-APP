-- ============================================================
-- Migration 012: Fix remaining schema issues
-- Addresses:
--   1. finished_goods table definition (missing migration)
--   2. batch_number global UNIQUE → UNIQUE(company_id, batch_number)
--   5. Race condition in create_company_and_profile
--   6. created_by on data tables
--   7. UNIQUE(company_id, name) constraints
--   8. Indexes on company_id
--   9. created_by trigger for profiles.role consistency
-- ============================================================

-- 1. Ensure finished_goods table exists with proper schema.
--    If already exists (created before migration system), add missing columns.
CREATE TABLE IF NOT EXISTS finished_goods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  quantity_in_stock DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  company_id UUID REFERENCES companies(id),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY;

-- Add company_id and created_by if the table already existed without them
ALTER TABLE finished_goods ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE finished_goods ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Drop global UNIQUE on batch_number, add per-company UNIQUE
ALTER TABLE production_batches DROP CONSTRAINT IF EXISTS production_batches_batch_number_key;
DROP INDEX IF EXISTS production_batches_batch_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_production_batches_company_batch
  ON production_batches(company_id, batch_number);

-- 3. Fix race condition in create_company_and_profile with advisory lock
CREATE OR REPLACE FUNCTION create_company_and_profile(company_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Acquire advisory lock to prevent race condition on concurrent calls
  PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));

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

-- 4. Add created_by columns where missing
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE bill_of_materials ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE bill_of_materials_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE batch_materials ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 5. Add UNIQUE(company_id, name) constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_materials_company_name
  ON raw_materials(company_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_finished_goods_company_name
  ON finished_goods(company_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bill_of_materials_company_name
  ON bill_of_materials(company_id, name);

-- 6. Add indexes on company_id for all data tables
CREATE INDEX IF NOT EXISTS idx_raw_materials_company_id ON raw_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_company_id ON finished_goods(company_id);
CREATE INDEX IF NOT EXISTS idx_bill_of_materials_company_id ON bill_of_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_bill_of_materials_items_company_id ON bill_of_materials_items(company_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_company_id ON production_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_batch_materials_company_id ON batch_materials(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- 7. Trigger function: auto-fill company_id on INSERT for all data tables
CREATE OR REPLACE FUNCTION set_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := (SELECT company_id FROM profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_raw_materials_set_company_id
  BEFORE INSERT ON raw_materials FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER trg_finished_goods_set_company_id
  BEFORE INSERT ON finished_goods FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER trg_bill_of_materials_set_company_id
  BEFORE INSERT ON bill_of_materials FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER trg_bill_of_materials_items_set_company_id
  BEFORE INSERT ON bill_of_materials_items FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER trg_production_batches_set_company_id
  BEFORE INSERT ON production_batches FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER trg_batch_materials_set_company_id
  BEFORE INSERT ON batch_materials FOR EACH ROW EXECUTE FUNCTION set_company_id();
CREATE TRIGGER trg_sales_set_company_id
  BEFORE INSERT ON sales FOR EACH ROW EXECUTE FUNCTION set_company_id();

-- 8. Trigger function: auto-fill created_by on INSERT
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_raw_materials_set_created_by
  BEFORE INSERT ON raw_materials FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER trg_finished_goods_set_created_by
  BEFORE INSERT ON finished_goods FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER trg_bill_of_materials_set_created_by
  BEFORE INSERT ON bill_of_materials FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER trg_bill_of_materials_items_set_created_by
  BEFORE INSERT ON bill_of_materials_items FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER trg_production_batches_set_created_by
  BEFORE INSERT ON production_batches FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER trg_batch_materials_set_created_by
  BEFORE INSERT ON batch_materials FOR EACH ROW EXECUTE FUNCTION set_created_by();
CREATE TRIGGER trg_sales_set_created_by
  BEFORE INSERT ON sales FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- 9. Note: profiles.role is intentionally kept for future multi-user support.
--    It will be used when adding company members with different access levels.
