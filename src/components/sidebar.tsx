"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Raw Materials", href: "/raw-materials" },
  { label: "Bill of Materials", href: "/bill-of-materials" },
  { label: "Production", href: "/production" },
  { label: "Build History", href: "/build-history" },
  { label: "Finished Goods", href: "/finished-goods" },
  { label: "Sales", href: "/sales" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">SME CAL</h1>
        <p className="text-sm text-gray-400 mt-1">Manufacturing Profitability</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
