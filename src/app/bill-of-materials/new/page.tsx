import { supabase } from "@/lib/supabase";
import { createBOM } from "@/lib/actions/bill-of-materials";
import { BOMForm } from "@/components/bom-form";
import type { RawMaterial, FinishedGood } from "@/lib/types";

export default async function NewBOMPage() {
  const [fgResult, rmResult] = await Promise.all([
    supabase.from("finished_goods").select("id, name, unit").order("name"),
    supabase.from("raw_materials").select("id, name, unit").order("name"),
  ]);

  const finishedGoods = (fgResult.data ?? []) as Pick<FinishedGood, "id" | "name" | "unit">[];
  const rawMaterials = (rmResult.data ?? []) as Pick<RawMaterial, "id" | "name" | "unit">[];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">New Bill of Materials</h2>
      <p className="text-gray-500 mt-1">
        Define the raw materials and quantities needed to produce one unit of a finished good.
      </p>
      <BOMForm action={createBOM} finishedGoods={finishedGoods} rawMaterials={rawMaterials} />
    </div>
  );
}
