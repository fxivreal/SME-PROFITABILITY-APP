import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/dashboard-layout";

export const metadata: Metadata = {
  title: "SME CAL - Manufacturing Profitability",
  description: "Manufacturing Profitability Calculator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
