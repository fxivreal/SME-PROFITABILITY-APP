import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { deleteBOM } from "@/lib/actions/bill-of-materials";
import { DeleteButton } from "@/components/delete-button";
import type { BillOfMaterial, FinishedGood } from "@/lib/types";

export default async function BillOfMaterialsPage() {
  const { data: boms } = await supabase
    .from("bill_of_materials")
    .select("*, bill_of_materials_items(count)")
    .order("created_at", { ascending: false });

  const fgIds = [...new Set((boms ?? []).map((b) => b.finished_good_id))];

  const { data: finishedGoods } = fgIds.length > 0
    ? await supabase.from("finished_goods").select("id, name").in("id", fgIds)
    : { data: [] };

  const fgMap = new Map((finishedGoods ?? []).map((fg) => [fg.id, fg.name]));

  const items = (boms ?? []) as (BillOfMaterial & {
    bill_of_materials_items: { count: number }[];
  })[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Bill of Materials</h2>
          <p className="text-gray-500 mt-1">Define recipes that list the raw materials required to produce each finished good.</p>
        </div>
        <Link
          href="/bill-of-materials/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New BOM
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-gray-400 text-center">No bill of materials yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="py-3 pr-6">Name</th>
                <th className="py-3 pr-6">Finished Good</th>
                <th className="py-3 pr-6">Materials</th>
                <th className="py-3 pr-6">Active</th>
                <th className="py-3 pr-6">Created</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {items.map((bom) => {
                const itemCount = bom.bill_of_materials_items?.[0]?.count ?? 0;
                return (
                  <tr key={bom.id}>
                    <td className="py-3 pr-6">
                      <Link
                        href={`/bill-of-materials/${bom.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {bom.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-6">{fgMap.get(bom.finished_good_id) ?? "—"}</td>
                    <td className="py-3 pr-6 text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</td>
                    <td className="py-3 pr-6">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${bom.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {bom.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-6">{new Date(bom.created_at).toLocaleDateString()}</td>
                    <td className="py-3 flex gap-3">
                      <Link
                        href={`/bill-of-materials/${bom.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <DeleteButton deleteAction={deleteBOM.bind(null, bom.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
