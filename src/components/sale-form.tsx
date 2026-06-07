"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import type { SaleFormState } from "@/lib/actions/sales";
import type { FinishedGood } from "@/lib/types";

type Props = {
  action: (prevState: SaleFormState, formData: FormData) => Promise<SaleFormState>;
  products: Pick<FinishedGood, "id" | "name" | "selling_price">[];
};

export function SaleForm({ action, products }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [selectedProductId, setSelectedProductId] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <form action={formAction} className="mt-6 max-w-md space-y-4">
      <div>
        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
          Product
        </label>
        <select
          id="product_id"
          name="product_id"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {state.errors?.product_id && (
          <p className="mt-1 text-sm text-red-600">{state.errors.product_id}</p>
        )}
      </div>

      <div>
        <label htmlFor="quantity_sold" className="block text-sm font-medium text-gray-700">
          Quantity Sold
        </label>
        <input
          id="quantity_sold"
          name="quantity_sold"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="e.g. 10"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.quantity_sold && (
          <p className="mt-1 text-sm text-red-600">{state.errors.quantity_sold}</p>
        )}
      </div>

      <div>
        <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">
          Selling Price (per unit)
        </label>
        <input
          id="selling_price"
          name="selling_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={selectedProduct?.selling_price ?? ""}
          key={selectedProductId}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
        {state.errors?.selling_price && (
          <p className="mt-1 text-sm text-red-600">{state.errors.selling_price}</p>
        )}
      </div>

      <div>
        <label htmlFor="sale_date" className="block text-sm font-medium text-gray-700">
          Sale Date
        </label>
        <input
          id="sale_date"
          name="sale_date"
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Record Sale
        </button>
        <Link
          href="/sales"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
