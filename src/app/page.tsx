import { createClient } from "@/lib/supabase";
import type { FinishedGood, Sale } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [salesResult, fgResult] = await Promise.all([
    supabase.from("sales").select("product_id, quantity_sold, selling_price"),
    supabase.from("finished_goods").select("id, name, unit, selling_price, cost_per_unit, quantity_in_stock").order("name"),
  ]);

  const sales = (salesResult.data ?? []) as Pick<Sale, "product_id" | "quantity_sold" | "selling_price">[];
  const finishedGoods = (fgResult.data ?? []) as Pick<FinishedGood, "id" | "name" | "unit" | "selling_price" | "cost_per_unit" | "quantity_in_stock">[];

  const salesByProduct = new Map<string, { unitsSold: number; revenue: number }>();
  for (const s of sales) {
    const prev = salesByProduct.get(s.product_id) ?? { unitsSold: 0, revenue: 0 };
    salesByProduct.set(s.product_id, {
      unitsSold: prev.unitsSold + Number(s.quantity_sold),
      revenue: prev.revenue + Number(s.quantity_sold) * Number(s.selling_price),
    });
  }

  let totalRevenue = 0;
  let totalCost = 0;

  const productRows = finishedGoods.map((fg) => {
    const saleData = salesByProduct.get(fg.id) ?? { unitsSold: 0, revenue: 0 };
    const cogs = saleData.unitsSold * Number(fg.cost_per_unit);
    const grossProfit = saleData.revenue - cogs;
    totalRevenue += saleData.revenue;
    totalCost += cogs;
    return { ...fg, ...saleData, cogs, grossProfit };
  }).filter((r) => r.unitsSold > 0);

  const totalGrossProfit = totalRevenue - totalCost;

  function naira(value: number) {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
      <p className="text-gray-500 mt-1">Overview of manufacturing profitability.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{naira(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">Total Cost</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{naira(totalCost)}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Gross Profit</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{naira(totalGrossProfit)}</p>
        </div>
      </div>

      {productRows.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-800">Product Profitability</h3>
          <p className="text-sm text-gray-500 mt-1">Revenue, COGS, and gross profit per product.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="py-3 pr-3 sm:pr-6">Product</th>
                  <th className="py-3 pr-3 sm:pr-6">Unit</th>
                  <th className="py-3 pr-3 sm:pr-6">Units Sold</th>
                  <th className="py-3 pr-3 sm:pr-6">Revenue</th>
                  <th className="py-3 pr-3 sm:pr-6">COGS</th>
                  <th className="py-3">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {productRows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-3 sm:pr-6 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 pr-3 sm:pr-6">{r.unit}</td>
                    <td className="py-3 pr-3 sm:pr-6">{r.unitsSold.toFixed(2)}</td>
                    <td className="py-3 pr-3 sm:pr-6">{naira(r.revenue)}</td>
                    <td className="py-3 pr-3 sm:pr-6">{naira(r.cogs)}</td>
                    <td className={`py-3 font-medium ${r.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {naira(r.grossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {productRows.length === 0 && (
        <p className="mt-10 text-gray-400 text-center">No sales yet. Start by creating raw materials, building a BOM, running a production batch, and recording sales.</p>
      )}
    </div>
  );
}
