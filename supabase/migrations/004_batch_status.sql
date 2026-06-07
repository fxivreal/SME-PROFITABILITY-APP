ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled'));

ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS bom_id UUID REFERENCES bill_of_materials(id);
