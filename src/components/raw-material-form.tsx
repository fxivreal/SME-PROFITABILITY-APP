"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { RawMaterialFormState } from "@/lib/actions/raw-materials";

type Props = {
  action: (
    prevState: RawMaterialFormState,
    formData: FormData,
  ) => Promise<RawMaterialFormState>;
  initialData?: {
    name: string;
    unit: string;
    quantity_in_stock: number;
    cost_per_unit: number;
  };
};

export function RawMaterialForm({ action, initialData }: Props) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-6 max-w-md space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
          Unit
        </label>
        <select
          id="unit"
          name="unit"
          defaultValue={initialData?.unit ?? ""}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="" disabled>Select unit</option>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="liters">liters</option>
          <option value="ml">ml</option>
          <option value="pieces">pieces</option>
          <option value="meters">meters</option>
          <option value="inches">inches</option>
          <option value="color">color</option>
        </select>
        {state.errors?.unit && (
          <p className="mt-1 text-sm text-red-600">{state.errors.unit}</p>
        )}
      </div>

      <div>
        <label htmlFor="quantity_in_stock" className="block text-sm font-medium text-gray-700">
          Quantity in Stock
        </label>
        <input
          id="quantity_in_stock"
          name="quantity_in_stock"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialData?.quantity_in_stock}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.quantity_in_stock && (
          <p className="mt-1 text-sm text-red-600">{state.errors.quantity_in_stock}</p>
        )}
      </div>

      <div>
        <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-700">
          Cost per Unit
        </label>
        <input
          id="cost_per_unit"
          name="cost_per_unit"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialData?.cost_per_unit}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.cost_per_unit && (
          <p className="mt-1 text-sm text-red-600">{state.errors.cost_per_unit}</p>
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
          {initialData ? "Update" : "Create"}
        </button>
        <Link
          href="/raw-materials"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
