import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Sale } from "@/lib/types";

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select("*, finished_goods!product_id(name)")
    .order("sale_date", { ascending: false });

  const items = (sales ?? []) as (Sale & {
    finished_goods: { name: string };
  })[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Sales</h2>
          <p className="text-gray-500 mt-1">Record sales to reduce finished goods stock and track revenue.</p>
        </div>
        <Link
          href="/sales/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Record Sale
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-gray-400 text-center">No sales recorded yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="py-3 pr-3 sm:pr-6">Date</th>
                <th className="py-3 pr-3 sm:pr-6">Product</th>
                <th className="py-3 pr-3 sm:pr-6">Quantity Sold</th>
                <th className="py-3 pr-3 sm:pr-6">Selling Price</th>
                <th className="py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {items.map((sale) => {
                const revenue = sale.quantity_sold * sale.selling_price;
                return (
                  <tr key={sale.id}>
                    <td className="py-3 pr-3 sm:pr-6">{sale.sale_date}</td>
                    <td className="py-3 pr-3 sm:pr-6 font-medium text-gray-900">{sale.finished_goods.name}</td>
                    <td className="py-3 pr-3 sm:pr-6">{Number(sale.quantity_sold).toFixed(2)}</td>
                    <td className="py-3 pr-3 sm:pr-6">
                      ₦{Number(sale.selling_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 font-medium text-gray-900">
                      ₦{revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
