import { createClient } from "@/lib/supabase";
import { PaginatedTable } from "@/components/paginated-table";
import type { FinishedGood } from "@/lib/types";

export default async function FinishedGoodsPage() {
  const supabase = await createClient();
  const { data: finishedGoods } = await supabase
    .from("finished_goods")
    .select("*")
    .order("name");

  const items = (finishedGoods ?? []) as FinishedGood[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Finished Goods</h2>
          <p className="text-gray-500 mt-1">Product catalog and current inventory levels.</p>
        </div>
      </div>

      <PaginatedTable items={items} keyExtractor={(i) => i.id} renderRow={(item) => {
        const totalValue = item.quantity_in_stock * item.selling_price;
        return (
          <>
            <td className="py-3 pr-3 sm:pr-6 font-medium text-gray-900">{item.name}</td>
            <td className="py-3 pr-3 sm:pr-6">{item.unit}</td>
            <td className="py-3 pr-3 sm:pr-6">{Number(item.quantity_in_stock).toFixed(2)}</td>
            <td className="py-3 pr-3 sm:pr-6">
              ₦{Number(item.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="py-3 pr-3 sm:pr-6">
              ₦{Number(item.selling_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="py-3 font-medium text-gray-900">
              ₦{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </>
        );
      }} emptyMessage="No finished goods yet. Create a Bill of Materials to add one.">
        <thead>
          <tr className="text-left text-sm font-medium text-gray-500">
            <th className="py-3 pr-3 sm:pr-6">Name</th>
            <th className="py-3 pr-3 sm:pr-6">Unit</th>
            <th className="py-3 pr-3 sm:pr-6">Quantity in Stock</th>
            <th className="py-3 pr-3 sm:pr-6">Cost per Unit</th>
            <th className="py-3 pr-3 sm:pr-6">Selling Price</th>
            <th className="py-3">Total Value</th>
          </tr>
        </thead>
      </PaginatedTable>
    </div>
  );
}
