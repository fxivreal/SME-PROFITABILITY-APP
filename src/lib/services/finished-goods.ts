import { createClient } from "@/lib/supabase";

export async function getFinishedGood(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finished_goods")
    .select("id, name, unit, quantity_in_stock, selling_price, cost_per_unit")
    .eq("id", id)
    .single();
  if (error) throw new Error("Finished good not found");
  return data;
}

export async function getFinishedGoods() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finished_goods")
    .select("id, name, unit")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addStock(id: string, quantity: number, costPerUnit: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("finished_goods")
    .update({
      quantity_in_stock: quantity,
      cost_per_unit: costPerUnit,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
