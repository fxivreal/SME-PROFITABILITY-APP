export type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  quantity_in_stock: number;
  cost_per_unit: number;
  created_at: string;
  company_id: string;
  created_by: string;
};

export type FinishedGood = {
  id: string;
  name: string;
  unit: string;
  selling_price: number;
  quantity_in_stock: number;
  cost_per_unit: number;
  created_at: string;
  company_id: string;
  created_by: string;
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
  company_id: string;
  created_by: string;
};

export type BatchMaterial = {
  id: string;
  batch_id: string;
  raw_material_id: string;
  quantity_used: number;
  company_id: string;
};

export type BillOfMaterial = {
  id: string;
  finished_good_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  company_id: string;
  created_by: string;
};

export type BillOfMaterialItem = {
  id: string;
  bom_id: string;
  raw_material_id: string;
  quantity_required: number;
  created_at: string;
  company_id: string;
};

export type Sale = {
  id: string;
  product_id: string;
  quantity_sold: number;
  selling_price: number;
  sale_date: string;
  created_at: string;
  company_id: string;
  created_by: string;
};

export type Company = {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
};

export type Profile = {
  id: string;
  company_id: string;
  role: string;
  created_at: string;
};
