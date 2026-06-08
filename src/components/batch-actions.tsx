"use client";

import { useState, useTransition } from "react";
import { completeBatch } from "@/lib/actions/production";
import { CompleteBatchModal } from "./complete-batch-modal";

type Props = {
  batchId: string;
  status: "pending" | "completed";
};

export function BatchActions({ batchId, status }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (status === "completed") {
    return (
      <span className="text-sm font-medium text-green-600">Completed</span>
    );
  }

  async function handleComplete(
    costs: { description: string; amount: number }[],
  ) {
    startTransition(async () => {
      const result = await completeBatch(batchId, costs);
      if (!result.success) {
        alert(result.error);
      }
      setShowModal(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? "Completing..." : "Complete"}
      </button>

      {showModal && (
        <CompleteBatchModal
          onClose={() => setShowModal(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
