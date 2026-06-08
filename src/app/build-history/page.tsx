import { createClient } from "@/lib/supabase";
import { BuildHistoryFilters } from "@/components/build-history-filters";
import type { ProductionBatch, FinishedGood, BillOfMaterial } from "@/lib/types";

type SearchParams = {
  search?: string;
  finished_good_id?: string;
  date_from?: string;
  date_to?: string;
};

export default async function BuildHistoryPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("production_batches")
    .select("*, finished_goods!finished_good_id(id, name), bill_of_materials!bom_id(id, name)")
    .order("created_at", { ascending: false });

  if (sp.search) {
    query = query.ilike("batch_number", `%${sp.search}%`);
  }
  if (sp.finished_good_id) {
    query = query.eq("finished_good_id", sp.finished_good_id);
  }
  if (sp.date_from) {
    query = query.gte("production_date", sp.date_from);
  }
  if (sp.date_to) {
    query = query.lte("production_date", sp.date_to);
  }

  const { data: batches } = await query;

  const { data: finishedGoods } = await supabase
    .from("finished_goods")
    .select("id, name")
    .order("name");

  const items = (batches ?? []) as (ProductionBatch & {
    finished_goods: { name: string };
    bill_of_materials: { name: string };
  })[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Build History</h2>
          <p className="text-gray-500 mt-1">View completed production builds. Completed builds are read-only.</p>
        </div>
      </div>

      <BuildHistoryFilters finishedGoods={(finishedGoods ?? []) as { id: string; name: string }[]} />

      {items.length === 0 ? (
        <p className="mt-8 text-gray-400 text-center">No builds found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="py-3 pr-3 sm:pr-6">Batch</th>
                <th className="py-3 pr-3 sm:pr-6">Product</th>
                <th className="py-3 pr-3 sm:pr-6">Qty Built</th>
                <th className="py-3 pr-3 sm:pr-6">Material Cost</th>
                <th className="py-3 pr-3 sm:pr-6">Add. Cost</th>
                <th className="py-3 pr-3 sm:pr-6">Total Cost</th>
                <th className="py-3 pr-3 sm:pr-6">Cost / Unit</th>
                <th className="py-3 pr-3 sm:pr-6">Production Date</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {items.map((batch) => (
                <tr key={batch.id}>
                  <td className="py-3 pr-3 sm:pr-6 font-medium text-gray-900">{batch.batch_number}</td>
                  <td className="py-3 pr-3 sm:pr-6">{batch.finished_goods?.name ?? "—"}</td>
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
                    {batch.total_material_cost || batch.total_additional_cost
                      ? `₦${(Number(batch.total_material_cost || 0) + Number(batch.total_additional_cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 sm:pr-6">
                    {batch.cost_per_unit
                      ? `₦${Number(batch.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 sm:pr-6">{batch.production_date}</td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      batch.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {batch.status}
                    </span>
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
