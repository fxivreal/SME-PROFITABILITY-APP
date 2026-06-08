-- ============================================================
-- Migration 015: Ensure company_id on ALL tables
-- Safely adds company_id + backfill + NOT NULL for every table
-- that might still be missing it. Catches missing-table errors.
-- Safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. Add company_id to each table (catches if table doesn't exist)
-- ============================================================

DO $$ BEGIN ALTER TABLE raw_materials           ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE finished_goods          ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE bill_of_materials       ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE bill_of_materials_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE production_batches      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE batch_materials         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE sales                   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); EXCEPTION WHEN undefined_table THEN NULL; END; $$;

-- ============================================================
-- 2. Backfill: assign new company_id to existing rows that are null
-- ============================================================

DO $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM companies ORDER BY created_at ASC LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE raw_materials           SET company_id = v_id WHERE company_id IS NULL;
    UPDATE finished_goods          SET company_id = v_id WHERE company_id IS NULL;
    UPDATE bill_of_materials       SET company_id = v_id WHERE company_id IS NULL;
    UPDATE bill_of_materials_items SET company_id = v_id WHERE company_id IS NULL;
    UPDATE production_batches      SET company_id = v_id WHERE company_id IS NULL;
    UPDATE batch_materials         SET company_id = v_id WHERE company_id IS NULL;
    UPDATE sales                   SET company_id = v_id WHERE company_id IS NULL;
  END IF;
END;
$$;

-- ============================================================
-- 3. Make company_id NOT NULL (catches if table doesn't exist or column is new)
-- ============================================================

DO $$ BEGIN ALTER TABLE raw_materials           ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE finished_goods          ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE bill_of_materials       ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE bill_of_materials_items ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE production_batches      ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE batch_materials         ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
DO $$ BEGIN ALTER TABLE sales                   ALTER COLUMN company_id SET NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END; $$;
