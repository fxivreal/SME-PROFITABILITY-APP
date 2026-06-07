"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import type { BOMFormState } from "@/lib/actions/bill-of-materials";
import type { RawMaterial } from "@/lib/types";

const units = ["kg", "g", "liters", "ml", "pieces", "meters", "inches", "color"];

type Props = {
  action: (prevState: BOMFormState, formData: FormData) => Promise<BOMFormState>;
  rawMaterials: Pick<RawMaterial, "id" | "name" | "unit">[];
  initialData?: {
    id: string;
    finished_good_name?: string;
    finished_good_unit?: string;
    items: { raw_material_id: string; quantity_required: number }[];
  };
};

type ItemRow = {
  raw_material_id: string;
  quantity_required: string;
};

export function BOMForm({ action, rawMaterials, initialData }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [rows, setRows] = useState<ItemRow[]>(
    initialData
      ? initialData.items.map((i) => ({
          raw_material_id: i.raw_material_id,
          quantity_required: String(i.quantity_required),
        }))
      : [{ raw_material_id: "", quantity_required: "" }],
  );

  function addRow() {
    setRows((prev) => [...prev, { raw_material_id: "", quantity_required: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof ItemRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  const usedIds = rows.map((r) => r.raw_material_id).filter(Boolean);

  return (
    <form action={formAction} className="mt-6 max-w-lg space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Finished Good
        </label>
        {initialData ? (
          <p className="text-sm text-gray-700">
            {initialData.finished_good_name} ({initialData.finished_good_unit})
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="fg_name" className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                id="fg_name"
                name="fg_name"
                type="text"
                placeholder="e.g. Chocolate Bar"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
              {state.errors?.fg_name && (
                <p className="mt-1 text-sm text-red-600">{state.errors.fg_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="fg_unit" className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                id="fg_unit"
                name="fg_unit"
                defaultValue=""
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>Select unit</option>
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {state.errors?.fg_unit && (
                <p className="mt-1 text-sm text-red-600">{state.errors.fg_unit}</p>
              )}
            </div>
            <div>
              <label htmlFor="fg_selling_price" className="block text-xs text-gray-500 mb-1">Selling Price</label>
              <input
                id="fg_selling_price"
                name="fg_selling_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 500"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
              {state.errors?.fg_selling_price && (
                <p className="mt-1 text-sm text-red-600">{state.errors.fg_selling_price}</p>
              )}
            </div>
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Raw Materials Required
          </label>
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Material
          </button>
        </div>

        <input type="hidden" name="items" value={JSON.stringify(
          rows.filter((r) => r.raw_material_id && r.quantity_required).map((r) => ({
            raw_material_id: r.raw_material_id,
            quantity_required: parseFloat(r.quantity_required),
          })),
        )} />

        <div className="mt-2 space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-start">
              <select
                value={row.raw_material_id}
                onChange={(e) => updateRow(i, "raw_material_id", e.target.value)}
                className="block w-1/2 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select material</option>
                {rawMaterials.map((rm) => (
                  <option
                    key={rm.id}
                    value={rm.id}
                    disabled={usedIds.includes(rm.id) && rm.id !== row.raw_material_id}
                  >
                    {rm.name} ({rm.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Qty required"
                value={row.quantity_required}
                onChange={(e) => updateRow(i, "quantity_required", e.target.value)}
                className="block w-1/3 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="mt-1.5 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {state.errors?.items && (
          <p className="mt-1 text-sm text-red-600">{state.errors.items}</p>
        )}
      </div>

      {state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {initialData ? "Update BOM" : "Create BOM"}
        </button>
        <Link
          href="/bill-of-materials"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
