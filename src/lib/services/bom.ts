import { supabase } from "@/lib/supabase";

export async function getBOMWithItems(id: string) {
  const { data, error } = await supabase
    .from("bill_of_materials")
    .select("*, bill_of_materials_items(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error("Bill of Materials not found");
  return data;
}

export async function getActiveBOMsWithItems() {
  const { data, error } = await supabase
    .from("bill_of_materials")
    .select("*, bill_of_materials_items(raw_material_id, quantity_required)")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
