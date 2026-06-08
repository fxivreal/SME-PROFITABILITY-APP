"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useCallback } from "react";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  function NavLinks({ onClick }: { onClick?: () => void }) {
    return (
      <>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
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
      </>
    );
  }

  function SidePanel({ onLinkClick }: { onLinkClick?: () => void }) {
    return (
      <>
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-tight">SME CAL</h1>
          <p className="text-sm text-gray-400 mt-1">Manufacturing Profitability</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks onClick={onLinkClick} />
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full rounded px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
          >
            Sign Out
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden rounded bg-gray-900 p-2 text-white"
        aria-label="Open sidebar"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidePanel onLinkClick={close} />
      </aside>

      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col shrink-0">
        <SidePanel />
      </aside>
    </>
  );
}
