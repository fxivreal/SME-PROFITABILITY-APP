import { createClient } from "@/lib/supabase";
import { createBOM } from "@/lib/actions/bill-of-materials";
import { BOMForm } from "@/components/bom-form";
import type { RawMaterial } from "@/lib/types";

export default async function NewBOMPage() {
  const supabase = await createClient();
  const { data: rawMaterials } = await supabase
    .from("raw_materials")
    .select("id, name, unit, cost_per_unit")
    .order("name");

  const items = (rawMaterials ?? []) as Pick<RawMaterial, "id" | "name" | "unit" | "cost_per_unit">[];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">New Bill of Materials</h2>
      <p className="text-gray-500 mt-1">
        Define the finished good and the raw materials needed to produce one unit.
      </p>
      <BOMForm action={createBOM} rawMaterials={items} />
    </div>
  );
}
