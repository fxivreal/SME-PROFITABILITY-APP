"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBOMWithItems } from "@/lib/services/bom";
import { getRawMaterials } from "@/lib/services/raw-materials";
import {
  getNextBatchNumber,
  insertBatch,
  insertBatchMaterials,
  deleteBatch,
  completeBuildViaRPC,
} from "@/lib/services/production";

export type ProductionFormState = {
  errors?: {
    bom_id?: string;
    quantity_to_build?: string;
    production_date?: string;
  };
  message?: string;
};

export async function createProductionBatch(
  _prevState: ProductionFormState,
  formData: FormData,
): Promise<ProductionFormState> {
  const bomId = formData.get("bom_id") as string;
  const quantityToBuild = formData.get("quantity_to_build") as string;
  const productionDate = formData.get("production_date") as string;

  const errors: ProductionFormState["errors"] = {};

  if (!bomId) {
    errors.bom_id = "Select a Bill of Materials";
  }
  if (!quantityToBuild || isNaN(Number(quantityToBuild)) || Number(quantityToBuild) <= 0) {
    errors.quantity_to_build = "Must be a positive number";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const qtyToBuild = parseFloat(quantityToBuild);

  try {
    const bom = await getBOMWithItems(bomId);

    const items = (bom as unknown as {
      finished_good_id: string;
      bill_of_materials_items: { raw_material_id: string; quantity_required: number }[];
    }).bill_of_materials_items;

    if (!items || items.length === 0) {
      return { message: "Selected BOM has no materials defined" };
    }

    const rawMaterials = await getRawMaterials(items.map((i) => i.raw_material_id));

    if (rawMaterials.length !== items.length) {
      return { message: "One or more raw materials not found" };
    }

    const rmMap = new Map(rawMaterials.map((r) => [r.id, r]));
    const shortfalls: string[] = [];
    let maxBuildQty = Infinity;

    for (const item of items) {
      const rm = rmMap.get(item.raw_material_id);
      if (!rm) continue;
      const required = item.quantity_required * qtyToBuild;
      const available = Number(rm.quantity_in_stock);
      if (available < required) {
        shortfalls.push(`"${rm.name}": need ${required.toFixed(2)} ${rm.unit}, have ${available.toFixed(2)} ${rm.unit}`);
      }
      const perUnit = item.quantity_required;
      const possible = Math.floor(available / perUnit);
      if (possible < maxBuildQty) {
        maxBuildQty = possible;
      }
    }

    if (shortfalls.length > 0) {
      return {
        message: `Insufficient stock. Max build quantity: ${maxBuildQty}. ${shortfalls.join("; ")}`,
      };
    }

    const batchNumber = await getNextBatchNumber();
    const batch = await insertBatch({
      batch_number: batchNumber,
      production_date: productionDate || new Date().toISOString().split("T")[0],
      finished_good_id: (bom as unknown as { finished_good_id: string }).finished_good_id,
      quantity_to_build: qtyToBuild,
      bom_id: bomId,
    });

    const batchMaterials = items.map((item) => ({
      raw_material_id: item.raw_material_id,
      quantity_used: item.quantity_required * qtyToBuild,
    }));

    try {
      await insertBatchMaterials(batch.id, batchMaterials);
    } catch {
      await deleteBatch(batch.id);
      return { message: "Failed to save batch materials" };
    }
  } catch (err) {
    return { message: err instanceof Error ? err.message : "An error occurred" };
  }

  revalidatePath("/production");
  redirect("/production");
}

export async function completeBatch(batchId: string) {
  try {
    const result = await completeBuildViaRPC(batchId);
    revalidatePath("/production");
    revalidatePath("/build-history");
    return { success: true as const, total_material_cost: result.total_material_cost, cost_per_unit: result.cost_per_unit };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to complete build",
    };
  }
}
