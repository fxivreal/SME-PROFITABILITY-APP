"use client";

import { useTransition } from "react";
import { completeBatch } from "@/lib/actions/production";

type Props = {
  batchId: string;
  status: "pending" | "completed";
};

export function BatchActions({ batchId, status }: Props) {
  const [isPending, startTransition] = useTransition();

  if (status === "completed") {
    return (
      <span className="text-sm font-medium text-green-600">Completed</span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const result = await completeBatch(batchId);
        if (!result.success) {
          alert(result.error);
        }
      })}
      className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {isPending ? "Completing..." : "Complete"}
    </button>
  );
}
