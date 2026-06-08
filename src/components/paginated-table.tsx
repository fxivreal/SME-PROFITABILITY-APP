"use client";

import { useState, useEffect, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  renderRow: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  children: ReactNode;
  emptyMessage?: string;
};

export function PaginatedTable<T>({ items, renderRow, keyExtractor, children, emptyMessage }: Props<T>) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setPerPage(window.innerWidth < 768 ? 5 : 10);
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * perPage;
  const pageItems = items.slice(start, start + perPage);

  if (items.length === 0) {
    return <p className="mt-8 text-gray-400 text-center">{emptyMessage ?? "No data yet."}</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {children}
        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
          {pageItems.map((item) => (
            <tr key={keyExtractor(item)}>{renderRow(item)}</tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <span className="text-sm text-gray-500">{items.length} total</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
