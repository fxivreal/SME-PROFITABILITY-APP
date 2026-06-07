"use client";

import { useActionState } from "react";

type Props = {
  action: (prevState: { message?: string }, formData: FormData) => Promise<{ message?: string }>;
  itemId: string;
};

export function DeleteButton({ action, itemId }: Props) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={itemId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Are you sure you want to delete this item?")) {
            e.preventDefault();
          }
        }}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Delete
      </button>
      {state?.message && (
        <p className="mt-1 text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}
