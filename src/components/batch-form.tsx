"use client";

import { useState, useMemo, useActionState } from "react";
import Link from "next/link";
import type { ProductionFormState } from "@/lib/actions/production";
import type { RawMaterial, BillOfMaterial, BillOfMaterialItem } from "@/lib/types";

type BOMWithItems = Pick<BillOfMaterial, "id" | "name" | "finished_good_id"> & {
  items: Pick<BillOfMaterialItem, "raw_material_id" | "quantity_required">[];
};

type Props = {
  action: (
    prevState: ProductionFormState,
    formData: FormData,
  ) => Promise<ProductionFormState>;
  billOfMaterials: BOMWithItems[];
  rawMaterials: Pick<RawMaterial, "id" | "name" | "unit" | "quantity_in_stock">[];
};

export function BatchForm({ action, billOfMaterials, rawMaterials }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [selectedBomId, setSelectedBomId] = useState("");
  const [qtyToBuild, setQtyToBuild] = useState("");

  const rmMap = useMemo(
    () => new Map(rawMaterials.map((r) => [r.id, r])),
    [rawMaterials],
  );

  const selectedBom = useMemo(
    () => billOfMaterials.find((b) => b.id === selectedBomId),
    [billOfMaterials, selectedBomId],
  );

  const computedMaterials = useMemo(() => {
    if (!selectedBom || !qtyToBuild || isNaN(Number(qtyToBuild)) || Number(qtyToBuild) <= 0) {
      return [];
    }
    const qty = parseFloat(qtyToBuild);
    return selectedBom.items.map((item) => {
      const rm = rmMap.get(item.raw_material_id);
      const required = item.quantity_required * qty;
      return {
        raw_material_id: item.raw_material_id,
        quantity_used: required,
        materialName: rm?.name ?? "Unknown",
        unit: rm?.unit ?? "",
        available: rm?.quantity_in_stock ?? 0,
        sufficient: (rm?.quantity_in_stock ?? 0) >= required,
      };
    });
  }, [selectedBom, qtyToBuild, rmMap]);

  return (
    <form action={formAction} className="mt-6 max-w-2xl space-y-6">
      <div>
        <label htmlFor="bom_id" className="block text-sm font-medium text-gray-700">
          Bill of Materials
        </label>
        <select
          id="bom_id"
          name="bom_id"
          value={selectedBomId}
          onChange={(e) => setSelectedBomId(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select a BOM</option>
          {billOfMaterials.map((bom) => (
            <option key={bom.id} value={bom.id}>
              {bom.name}
            </option>
          ))}
        </select>
        {state.errors?.bom_id && (
          <p className="mt-1 text-sm text-red-600">{state.errors.bom_id}</p>
        )}
      </div>

      <div>
        <label htmlFor="production_date" className="block text-sm font-medium text-gray-700">
          Production Date
        </label>
        <input
          id="production_date"
          name="production_date"
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="quantity_to_build" className="block text-sm font-medium text-gray-700">
          Quantity To Build
        </label>
        <input
          id="quantity_to_build"
          name="quantity_to_build"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="e.g. 100"
          value={qtyToBuild}
          onChange={(e) => setQtyToBuild(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.quantity_to_build && (
          <p className="mt-1 text-sm text-red-600">{state.errors.quantity_to_build}</p>
        )}
      </div>

      {selectedBom && qtyToBuild && !isNaN(Number(qtyToBuild)) && Number(qtyToBuild) > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Materials
          </label>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-2">Material</th>
                  <th className="px-4 py-2">Quantity Required</th>
                  <th className="px-4 py-2">Quantity Available</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {computedMaterials.map((mat) => (
                  <tr key={mat.raw_material_id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{mat.materialName}</td>
                    <td className="px-4 py-2">
                      {mat.quantity_used.toFixed(2)} {mat.unit}
                    </td>
                    <td className="px-4 py-2">
                      {mat.available.toFixed(2)} {mat.unit}
                    </td>
                    <td className="px-4 py-2">
                      {mat.sufficient ? (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Sufficient
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Insufficient
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <input type="hidden" name="materials" value={JSON.stringify(
        computedMaterials.map((m) => ({
          raw_material_id: m.raw_material_id,
          quantity_used: m.quantity_used,
        })),
      )} />

      <div className="rounded border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        This batch will be created as <strong>Pending</strong>. Use the Complete action on the production list to execute the build when ready.
      </div>

      {state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Batch
        </button>
        <Link
          href="/production"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
