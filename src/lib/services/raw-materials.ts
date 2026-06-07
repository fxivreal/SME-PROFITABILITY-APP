import { supabase } from "@/lib/supabase";

export async function getRawMaterials(ids?: string[]) {
  let query = supabase.from("raw_materials").select("id, name, unit, quantity_in_stock, cost_per_unit");
  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }
  const { data, error } = await query.order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deductStock(id: string, quantity: number) {
  const { error } = await supabase
    .from("raw_materials")
    .update({ quantity_in_stock: quantity })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
