CREATE TABLE production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  output_product_id UUID NOT NULL REFERENCES finished_goods(id),
  output_quantity DECIMAL(12, 2) NOT NULL,
  total_material_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE batch_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
  quantity_used DECIMAL(12, 2) NOT NULL
);

ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON production_batches
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for anon" ON batch_materials
  FOR ALL TO anon USING (true) WITH CHECK (true);
