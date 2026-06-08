"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCompanyId } from "@/lib/supabase";

export type RawMaterialFormState = {
  errors?: {
    name?: string;
    unit?: string;
    quantity_in_stock?: string;
    cost_per_unit?: string;
  };
  message?: string;
};

export async function createRawMaterial(
  _prevState: RawMaterialFormState,
  formData: FormData,
): Promise<RawMaterialFormState> {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const quantityInStock = formData.get("quantity_in_stock") as string;
  const costPerUnit = formData.get("cost_per_unit") as string;

  const errors: RawMaterialFormState["errors"] = {};

  if (!name || !name.trim()) {
    errors.name = "Name is required";
  }
  if (!unit || !unit.trim()) {
    errors.unit = "Unit is required";
  }
  if (!quantityInStock || isNaN(Number(quantityInStock)) || Number(quantityInStock) < 0) {
    errors.quantity_in_stock = "Must be a non-negative number";
  }
  if (!costPerUnit || isNaN(Number(costPerUnit)) || Number(costPerUnit) < 0) {
    errors.cost_per_unit = "Must be a non-negative number";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const company_id = await getCompanyId();
  const { error } = await supabase.from("raw_materials").insert({
    company_id,
    name: name.trim(),
    unit: unit.trim(),
    quantity_in_stock: parseFloat(quantityInStock),
    cost_per_unit: parseFloat(costPerUnit),
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/raw-materials");
  redirect("/raw-materials");
}

export async function updateRawMaterial(
  id: string,
  _prevState: RawMaterialFormState,
  formData: FormData,
): Promise<RawMaterialFormState> {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const quantityInStock = formData.get("quantity_in_stock") as string;
  const costPerUnit = formData.get("cost_per_unit") as string;

  const errors: RawMaterialFormState["errors"] = {};

  if (!name || !name.trim()) {
    errors.name = "Name is required";
  }
  if (!unit || !unit.trim()) {
    errors.unit = "Unit is required";
  }
  if (!quantityInStock || isNaN(Number(quantityInStock)) || Number(quantityInStock) < 0) {
    errors.quantity_in_stock = "Must be a non-negative number";
  }
  if (!costPerUnit || isNaN(Number(costPerUnit)) || Number(costPerUnit) < 0) {
    errors.cost_per_unit = "Must be a non-negative number";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("raw_materials")
    .update({
      name: name.trim(),
      unit: unit.trim(),
      quantity_in_stock: parseFloat(quantityInStock),
      cost_per_unit: parseFloat(costPerUnit),
    })
    .eq("id", id);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/raw-materials");
  redirect("/raw-materials");
}

export async function deleteRawMaterial(_prevState: { message?: string }, formData: FormData): Promise<{ message?: string }> {
  const id = formData.get("id") as string;
  if (!id) return { message: "Missing item ID" };

  const supabase = await createClient();
  const { error } = await supabase.from("raw_materials").delete().eq("id", id);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/raw-materials");
  return {};
}
