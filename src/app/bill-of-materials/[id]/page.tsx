import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { deleteBOM } from "@/lib/actions/bill-of-materials";
import { DeleteButton } from "@/components/delete-button";
import type { BillOfMaterial, BillOfMaterialItem, RawMaterial, FinishedGood } from "@/lib/types";

export default async function BOMDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: bom } = await supabase
    .from("bill_of_materials")
    .select("*, bill_of_materials_items(*)")
    .eq("id", id)
    .single();

  if (!bom) {
    notFound();
  }

  const bomData = bom as BillOfMaterial & {
    bill_of_materials_items: (BillOfMaterialItem & { raw_material_id: string })[];
  };

  const rmIds = bomData.bill_of_materials_items.map((i) => i.raw_material_id);
  const { data: rawMaterials } = rmIds.length > 0
    ? await supabase.from("raw_materials").select("id, name, unit").in("id", rmIds)
    : { data: [] };

  const rmMap = new Map((rawMaterials ?? []).map((r) => [r.id, r]));

  const { data: fg } = await supabase
    .from("finished_goods")
    .select("name, unit")
    .eq("id", bomData.finished_good_id)
    .single();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">{bomData.name}</h2>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${bomData.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
              {bomData.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Recipe for <strong>{fg?.name ?? "Unknown"}</strong>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/bill-of-materials/${id}/edit`}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteButton action={deleteBOM} itemId={id} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Raw Materials Required</h3>
        {bomData.bill_of_materials_items.length === 0 ? (
          <p className="text-gray-400">No materials defined for this BOM.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="py-3 pr-6">#</th>
                  <th className="py-3 pr-6">Raw Material</th>
                  <th className="py-3 pr-6">Unit</th>
                  <th className="py-3">Quantity Required (per unit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {bomData.bill_of_materials_items.map((item, i) => {
                  const rm = rmMap.get(item.raw_material_id);
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-6 text-gray-400">{i + 1}</td>
                      <td className="py-3 pr-6 font-medium text-gray-900">{rm?.name ?? "Unknown"}</td>
                      <td className="py-3 pr-6">{rm?.unit ?? "—"}</td>
                      <td className="py-3">{Number(item.quantity_required).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/bill-of-materials"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to Bill of Materials
        </Link>
      </div>
    </div>
  );
}
