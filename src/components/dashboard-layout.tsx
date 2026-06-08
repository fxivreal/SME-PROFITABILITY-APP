"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";

const noSidebarPrefixes = ["/auth/", "/company/"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = noSidebarPrefixes.some((p) => pathname.startsWith(p));

  if (hideSidebar) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-8 pt-14 md:pt-8">{children}</main>
    </div>
  );
}
