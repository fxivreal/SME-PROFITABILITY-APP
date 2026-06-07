CREATE TABLE IF NOT EXISTS bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_good_id UUID NOT NULL REFERENCES finished_goods(id),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_of_materials_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
  quantity_required DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON bill_of_materials
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for anon" ON bill_of_materials_items
  FOR ALL TO anon USING (true) WITH CHECK (true);
