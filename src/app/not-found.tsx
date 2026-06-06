import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h2 className="text-xl font-semibold text-gray-800">Page not found</h2>
      <p className="text-gray-500">Could not find the requested page.</p>
      <Link
        href="/"
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
