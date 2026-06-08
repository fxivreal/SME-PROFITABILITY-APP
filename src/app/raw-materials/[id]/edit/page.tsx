import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { updateRawMaterial } from "@/lib/actions/raw-materials";
import { RawMaterialForm } from "@/components/raw-material-form";
import type { RawMaterial } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRawMaterialPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: rawMaterial } = await supabase
    .from("raw_materials")
    .select("*")
    .eq("id", id)
    .single();

  if (!rawMaterial) {
    notFound();
  }

  const item = rawMaterial as RawMaterial;
  const updateAction = updateRawMaterial.bind(null, id);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">Edit Raw Material</h2>
      <p className="text-gray-500 mt-1">Update the details of the raw material.</p>
      <RawMaterialForm
        action={updateAction}
        initialData={{
          name: item.name,
          unit: item.unit,
          quantity_in_stock: item.quantity_in_stock,
          cost_per_unit: item.cost_per_unit,
        }}
      />
    </div>
  );
}
