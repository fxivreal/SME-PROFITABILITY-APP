export type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  quantity_in_stock: number;
  cost_per_unit: number;
  created_at: string;
};

export type FinishedGood = {
  id: string;
  name: string;
  unit: string;
  selling_price: number;
  quantity_in_stock: number;
  cost_per_unit: number;
  created_at: string;
};

export type ProductionBatch = {
  id: string;
  batch_number: string;
  production_date: string;
  finished_good_id: string;
  quantity_to_build: number;
  total_material_cost: number;
  cost_per_unit: number;
  status: "pending" | "completed";
  bom_id: string | null;
  created_at: string;
};

export type BatchMaterial = {
  id: string;
  batch_id: string;
  raw_material_id: string;
  quantity_used: number;
};

export type BillOfMaterial = {
  id: string;
  finished_good_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type BillOfMaterialItem = {
  id: string;
  bom_id: string;
  raw_material_id: string;
  quantity_required: number;
  created_at: string;
};
