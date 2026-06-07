"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  finishedGoods: { id: string; name: string }[];
};

export function BuildHistoryFilters({ finishedGoods }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [productId, setProductId] = useState(searchParams.get("finished_good_id") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") ?? "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (productId) params.set("finished_good_id", productId);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    router.push(`/build-history?${params.toString()}`);
  }

  function clearFilters() {
    setSearch("");
    setProductId("");
    setDateFrom("");
    setDateTo("");
    router.push("/build-history");
  }

  return (
    <div className="flex flex-wrap items-end gap-3 mt-6">
      <div>
        <label htmlFor="search" className="block text-xs font-medium text-gray-600 mb-1">Batch Number</label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. BATCH-001"
          className="block w-48 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="product" className="block text-xs font-medium text-gray-600 mb-1">Product</label>
        <select
          id="product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="block w-44 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All products</option>
          {finishedGoods.map((fg) => (
            <option key={fg.id} value={fg.id}>{fg.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="date_from" className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
        <input
          id="date_from"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="block w-40 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="date_to" className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
        <input
          id="date_to"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="block w-40 rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={applyFilters}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
