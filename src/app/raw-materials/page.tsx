import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { deleteRawMaterial } from "@/lib/actions/raw-materials";
import { DeleteButton } from "@/components/delete-button";
import { PaginatedTable } from "@/components/paginated-table";
import type { RawMaterial } from "@/lib/types";

export default async function RawMaterialsPage() {
  const supabase = await createClient();
  const { data: rawMaterials } = await supabase
    .from("raw_materials")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (rawMaterials ?? []) as RawMaterial[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Raw Materials</h2>
          <p className="text-gray-500 mt-1">Manage raw material inventory and costs.</p>
        </div>
        <Link
          href="/raw-materials/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Raw Material
        </Link>
      </div>

      <PaginatedTable items={items} keyExtractor={(i) => i.id} renderRow={(item) => (
        <>
          <td className="py-3 pr-3 sm:pr-6 font-medium text-gray-900">{item.name}</td>
          <td className="py-3 pr-3 sm:pr-6">{item.unit}</td>
          <td className="py-3 pr-3 sm:pr-6">{Number(item.quantity_in_stock).toFixed(2)}</td>
          <td className="py-3 pr-3 sm:pr-6">
            ₦{Number(item.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td className="py-3 pr-3 sm:pr-6">
            ₦{(item.quantity_in_stock * item.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td className="py-3 flex gap-3">
            <Link
              href={`/raw-materials/${item.id}/edit`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </Link>
            <DeleteButton action={deleteRawMaterial} itemId={item.id} />
          </td>
        </>
      )} emptyMessage="No raw materials yet.">
        <thead>
          <tr className="text-left text-sm font-medium text-gray-500">
            <th className="py-3 pr-3 sm:pr-6">Name</th>
            <th className="py-3 pr-3 sm:pr-6">Unit</th>
            <th className="py-3 pr-3 sm:pr-6">Quantity in Stock</th>
            <th className="py-3 pr-3 sm:pr-6">Cost per Unit</th>
            <th className="py-3 pr-3 sm:pr-6">Total Value</th>
            <th className="py-3">Actions</th>
          </tr>
        </thead>
      </PaginatedTable>
    </div>
  );
}
