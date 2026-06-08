"use client";

import { useState } from "react";

type CostRow = {
  description: string;
  amount: string;
};

type Props = {
  onClose: () => void;
  onComplete: (costs: { description: string; amount: number }[]) => Promise<void>;
};

export function CompleteBatchModal({ onClose, onComplete }: Props) {
  const [costs, setCosts] = useState<CostRow[]>([{ description: "", amount: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addRow() {
    setCosts((prev) => [...prev, { description: "", amount: "" }]);
  }

  function removeRow(index: number) {
    setCosts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof CostRow, value: string) {
    setCosts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  const total = costs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const valid = costs
        .filter((c) => c.description.trim() && parseFloat(c.amount) > 0)
        .map((c) => ({ description: c.description.trim(), amount: parseFloat(c.amount) }));
      await onComplete(valid);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800">Additional Production Costs</h3>
        <p className="mt-1 text-sm text-gray-500">Enter any extra costs for this batch (transport, labor, packaging, etc.)</p>

        <div className="mt-4 space-y-3">
          {costs.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Description (e.g. Transport)"
                value={row.description}
                onChange={(e) => updateRow(i, "description", e.target.value)}
                className="block flex-1 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₦</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={row.amount}
                  onChange={(e) => updateRow(i, "amount", e.target.value)}
                  className="block w-32 rounded border border-gray-300 px-3 py-2 pl-7 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              {costs.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Cost
          </button>
        </div>

        <div className="mt-4 flex justify-between items-center border-t pt-3">
          <span className="text-sm font-medium text-gray-700">
            Total Additional: <span className="text-gray-900">₦{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        </div>

        <div className="mt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Completing..." : "Complete Batch"}
          </button>
        </div>
      </div>
    </div>
  );
}
