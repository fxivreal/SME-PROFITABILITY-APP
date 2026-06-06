"use client";

export function DeleteButton({ deleteAction }: { deleteAction: () => Promise<void> }) {
  return (
    <form action={deleteAction}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Are you sure you want to delete this raw material?")) {
            e.preventDefault();
          }
        }}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Delete
      </button>
    </form>
  );
}
