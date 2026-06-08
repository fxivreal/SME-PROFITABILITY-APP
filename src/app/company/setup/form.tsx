"use client";

import { useActionState } from "react";
import { createCompany } from "@/lib/actions/companies";

export default function CompanySetupForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => createCompany(formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Company Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
