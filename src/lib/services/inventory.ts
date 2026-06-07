import { supabase } from "@/lib/supabase";

export type StockValidationResult = {
  valid: boolean;
  errors: string[];
};

export async function validateStock(
  materials: { raw_material_id: string; quantity_used: number }[],
): Promise<StockValidationResult> {
  const ids = materials.map((m) => m.raw_material_id);
  const { data: rawMaterials, error } = await supabase
    .from("raw_materials")
    .select("id, name, quantity_in_stock")
    .in("id", ids);

  if (error || !rawMaterials) {
    return { valid: false, errors: ["Failed to fetch raw material stock"] };
  }

  const rmMap = new Map(rawMaterials.map((r) => [r.id, r]));
  const errors: string[] = [];

  for (const m of materials) {
    const rm = rmMap.get(m.raw_material_id);
    if (!rm) {
      errors.push(`Raw material ${m.raw_material_id} not found`);
    } else if (rm.quantity_in_stock < m.quantity_used) {
      errors.push(
        `Insufficient stock of "${rm.name}". Available: ${rm.quantity_in_stock}, Required: ${m.quantity_used}`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
