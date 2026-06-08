import { createClient } from "@/lib/supabase";
import { createProductionBatch } from "@/lib/actions/production";
import { BatchForm } from "@/components/batch-form";
import type { RawMaterial, BillOfMaterial, BillOfMaterialItem } from "@/lib/types";

export default async function NewProductionBatchPage() {
  const supabase = await createClient();
  const [bomResult, rmResult] = await Promise.all([
    supabase
      .from("bill_of_materials")
      .select("*, bill_of_materials_items(raw_material_id, quantity_required)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("raw_materials").select("id, name, unit, quantity_in_stock").order("name"),
  ]);

  const boms = (bomResult.data ?? []) as (Pick<BillOfMaterial, "id" | "name" | "finished_good_id"> & {
    bill_of_materials_items: Pick<BillOfMaterialItem, "raw_material_id" | "quantity_required">[];
  })[];

  const billOfMaterials = boms.map((b) => ({
    id: b.id,
    name: b.name,
    finished_good_id: b.finished_good_id,
    items: b.bill_of_materials_items,
  }));

  const rawMaterials = (rmResult.data ?? []) as Pick<RawMaterial, "id" | "name" | "unit" | "quantity_in_stock">[];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">New Production Batch</h2>
      <p className="text-gray-500 mt-1">
        Select a BOM and enter the quantity to build. Required materials will be calculated automatically. The batch starts as Pending.
      </p>
      <BatchForm
        action={createProductionBatch}
        billOfMaterials={billOfMaterials}
        rawMaterials={rawMaterials}
      />
    </div>
  );
}
