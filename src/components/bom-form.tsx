"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import type { BOMFormState } from "@/lib/actions/bill-of-materials";
import type { RawMaterial, FinishedGood } from "@/lib/types";

type Props = {
  action: (prevState: BOMFormState, formData: FormData) => Promise<BOMFormState>;
  finishedGoods: Pick<FinishedGood, "id" | "name" | "unit">[];
  rawMaterials: Pick<RawMaterial, "id" | "name" | "unit">[];
  initialData?: {
    id: string;
    name: string;
    finished_good_id: string;
    items: { raw_material_id: string; quantity_required: number }[];
  };
};

type ItemRow = {
  raw_material_id: string;
  quantity_required: string;
};

export function BOMForm({ action, finishedGoods, rawMaterials, initialData }: Props) {
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
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          BOM Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name}
          placeholder="e.g. Standard Recipe A"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="finished_good_id" className="block text-sm font-medium text-gray-700">
          Finished Good
        </label>
        <select
          id="finished_good_id"
          name="finished_good_id"
          defaultValue={initialData?.finished_good_id ?? ""}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="" disabled>Select finished good</option>
          {finishedGoods.map((fg) => (
            <option key={fg.id} value={fg.id}>
              {fg.name} ({fg.unit})
            </option>
          ))}
        </select>
        {state.errors?.finished_good_id && (
          <p className="mt-1 text-sm text-red-600">{state.errors.finished_good_id}</p>
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
