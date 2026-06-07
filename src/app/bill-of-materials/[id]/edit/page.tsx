import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { updateBOM } from "@/lib/actions/bill-of-materials";
import { BOMForm } from "@/components/bom-form";
import type { RawMaterial, FinishedGood } from "@/lib/types";

export default async function EditBOMPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const [bomResult, fgResult, rmResult] = await Promise.all([
    supabase.from("bill_of_materials").select("*, bill_of_materials_items(*)").eq("id", id).single(),
    supabase.from("finished_goods").select("id, name, unit").order("name"),
    supabase.from("raw_materials").select("id, name, unit").order("name"),
  ]);

  if (bomResult.error || !bomResult.data) {
    notFound();
  }

  const bom = bomResult.data as {
    id: string;
    name: string;
    finished_good_id: string;
    is_active: boolean;
    bill_of_materials_items: { raw_material_id: string; quantity_required: number }[];
  };

  const finishedGoods = (fgResult.data ?? []) as Pick<FinishedGood, "id" | "name" | "unit">[];
  const rawMaterials = (rmResult.data ?? []) as Pick<RawMaterial, "id" | "name" | "unit">[];

  const updateWithId = updateBOM.bind(null, id);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">Edit Bill of Materials</h2>
      <p className="text-gray-500 mt-1">Update the recipe for &quot;{bom.name}&quot;.</p>
      <BOMForm
        action={updateWithId}
        finishedGoods={finishedGoods}
        rawMaterials={rawMaterials}
        initialData={{
          id: bom.id,
          name: bom.name,
          finished_good_id: bom.finished_good_id,
          items: bom.bill_of_materials_items,
        }}
      />
    </div>
  );
}
