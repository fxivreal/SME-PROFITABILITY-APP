"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type BOMFormState = {
  errors?: {
    fg_name?: string;
    fg_unit?: string;
    fg_selling_price?: string;
    items?: string;
  };
  message?: string;
};

export async function createBOM(
  _prevState: BOMFormState,
  formData: FormData,
): Promise<BOMFormState> {
  const fgName = formData.get("fg_name") as string;
  const fgUnit = formData.get("fg_unit") as string;
  const fgSellingPrice = formData.get("fg_selling_price") as string;
  const itemsRaw = formData.get("items") as string;

  const errors: BOMFormState["errors"] = {};

  if (!fgName || !fgName.trim()) {
    errors.fg_name = "Name is required";
  }
  if (!fgUnit) {
    errors.fg_unit = "Select a unit";
  }
  if (!fgSellingPrice || isNaN(Number(fgSellingPrice)) || Number(fgSellingPrice) < 0) {
    errors.fg_selling_price = "Must be a non-negative number";
  }

  let items: { raw_material_id: string; quantity_required: number }[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    errors.items = "Invalid items data";
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "Add at least one raw material";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  for (const item of items) {
    if (!item.raw_material_id || !item.quantity_required || item.quantity_required <= 0) {
      return { errors: { items: "Each item must have a valid quantity" } };
    }
  }

  const { data: fg, error: fgError } = await supabase
    .from("finished_goods")
    .insert({
      name: fgName.trim(),
      unit: fgUnit,
      selling_price: parseFloat(fgSellingPrice),
    })
    .select()
    .single();

  if (fgError || !fg) {
    return { message: fgError?.message ?? "Failed to create finished good" };
  }

  const { data: bom, error: bomError } = await supabase
    .from("bill_of_materials")
    .insert({ name: fgName.trim(), finished_good_id: fg.id })
    .select()
    .single();

  if (bomError || !bom) {
    await supabase.from("finished_goods").delete().eq("id", fg.id);
    return { message: bomError?.message ?? "Failed to create BOM" };
  }

  const bomItems = items.map((item) => ({
    bom_id: bom.id,
    raw_material_id: item.raw_material_id,
    quantity_required: item.quantity_required,
  }));

  const { error: itemsError } = await supabase
    .from("bill_of_materials_items")
    .insert(bomItems);

  if (itemsError) {
    await supabase.from("bill_of_materials").delete().eq("id", bom.id);
    await supabase.from("finished_goods").delete().eq("id", fg.id);
    return { message: itemsError.message };
  }

  revalidatePath("/bill-of-materials");
  redirect("/bill-of-materials");
}

export async function updateBOM(
  id: string,
  _prevState: BOMFormState,
  formData: FormData,
): Promise<BOMFormState> {
  const itemsRaw = formData.get("items") as string;

  const errors: BOMFormState["errors"] = {};

  let items: { raw_material_id: string; quantity_required: number }[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    errors.items = "Invalid items data";
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "Add at least one raw material";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  for (const item of items) {
    if (!item.raw_material_id || !item.quantity_required || item.quantity_required <= 0) {
      return { errors: { items: "Each item must have a valid quantity" } };
    }
  }

  await supabase.from("bill_of_materials_items").delete().eq("bom_id", id);

  const bomItems = items.map((item) => ({
    bom_id: id,
    raw_material_id: item.raw_material_id,
    quantity_required: item.quantity_required,
  }));

  const { error: itemsError } = await supabase
    .from("bill_of_materials_items")
    .insert(bomItems);

  if (itemsError) {
    return { message: itemsError.message };
  }

  revalidatePath("/bill-of-materials");
  redirect("/bill-of-materials");
}

export async function deleteBOM(id: string) {
  const { error } = await supabase.from("bill_of_materials").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/bill-of-materials");
}

export async function getBOMWithItems(id: string) {
  const { data: bom } = await supabase
    .from("bill_of_materials")
    .select("*, bill_of_materials_items(*)")
    .eq("id", id)
    .single();

  return bom;
}
