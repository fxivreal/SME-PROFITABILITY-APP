import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { BatchActions } from "@/components/batch-actions";
import type { ProductionBatch, FinishedGood } from "@/lib/types";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

export default async function ProductionPage() {
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("production_batches")
    .select("*")
    .order("created_at", { ascending: false });

  const fgIds = [...new Set((batches ?? []).map((b) => b.finished_good_id))];

  const { data: finishedGoods } = fgIds.length > 0
    ? await supabase.from("finished_goods").select("id, name").in("id", fgIds)
    : { data: [] };

  const fgMap = new Map((finishedGoods ?? []).map((fg) => [fg.id, fg.name]));

  const { data: allBoms } = await supabase.from("bill_of_materials").select("id, name");
  const bomMap = new Map((allBoms ?? []).map((b) => [b.id, b.name]));

  const items = (batches ?? []) as ProductionBatch[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Production Batches</h2>
          <p className="text-gray-500 mt-1">Create batches from a BOM, then complete them to execute the build and move inventory.</p>
        </div>
        <Link
          href="/production/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Batch
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-gray-400 text-center">No production batches yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="py-3 pr-3 sm:pr-6">Batch</th>
                <th className="py-3 pr-3 sm:pr-6">Date</th>
                <th className="py-3 pr-3 sm:pr-6">Product</th>
                <th className="py-3 pr-3 sm:pr-6">BOM</th>
                <th className="py-3 pr-3 sm:pr-6">Qty To Build</th>
                <th className="py-3 pr-3 sm:pr-6">Material Cost</th>
                <th className="py-3 pr-3 sm:pr-6">Add. Cost</th>
                <th className="py-3 pr-3 sm:pr-6">Cost / Unit</th>
                <th className="py-3 pr-3 sm:pr-6">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {items.map((batch) => (
                <tr key={batch.id}>
                  <td className="py-3 pr-3 sm:pr-6 font-medium text-gray-900">{batch.batch_number}</td>
                  <td className="py-3 pr-3 sm:pr-6">{batch.production_date}</td>
                  <td className="py-3 pr-3 sm:pr-6">{fgMap.get(batch.finished_good_id) ?? "—"}</td>
                  <td className="py-3 pr-3 sm:pr-6 text-gray-400">
                    {batch.bom_id ? (bomMap.get(batch.bom_id) ?? "—") : "—"}
                  </td>
                  <td className="py-3 pr-3 sm:pr-6">{Number(batch.quantity_to_build).toFixed(2)}</td>
                  <td className="py-3 pr-3 sm:pr-6">
                    {batch.total_material_cost
                      ? `₦${Number(batch.total_material_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 sm:pr-6">
                    {batch.total_additional_cost
                      ? `₦${Number(batch.total_additional_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 sm:pr-6">
                    {batch.cost_per_unit
                      ? `₦${Number(batch.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 sm:pr-6">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[batch.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <BatchActions batchId={batch.id} status={batch.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
