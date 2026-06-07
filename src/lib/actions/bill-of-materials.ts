"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type BOMFormState = {
  errors?: {
    name?: string;
    finished_good_id?: string;
    items?: string;
  };
  message?: string;
};

export async function createBOM(
  _prevState: BOMFormState,
  formData: FormData,
): Promise<BOMFormState> {
  const name = formData.get("name") as string;
  const finishedGoodId = formData.get("finished_good_id") as string;
  const itemsRaw = formData.get("items") as string;

  const errors: BOMFormState["errors"] = {};

  if (!name || !name.trim()) {
    errors.name = "Name is required";
  }
  if (!finishedGoodId) {
    errors.finished_good_id = "Select a finished good";
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

  const { data: bom, error: bomError } = await supabase
    .from("bill_of_materials")
    .insert({ name: name.trim(), finished_good_id: finishedGoodId })
    .select()
    .single();

  if (bomError || !bom) {
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
  const name = formData.get("name") as string;
  const finishedGoodId = formData.get("finished_good_id") as string;
  const itemsRaw = formData.get("items") as string;

  const errors: BOMFormState["errors"] = {};

  if (!name || !name.trim()) {
    errors.name = "Name is required";
  }
  if (!finishedGoodId) {
    errors.finished_good_id = "Select a finished good";
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

  const { error: bomError } = await supabase
    .from("bill_of_materials")
    .update({ name: name.trim(), finished_good_id: finishedGoodId })
    .eq("id", id);

  if (bomError) {
    return { message: bomError.message };
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
