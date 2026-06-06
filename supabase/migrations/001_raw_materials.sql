CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity_in_stock DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON raw_materials
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
