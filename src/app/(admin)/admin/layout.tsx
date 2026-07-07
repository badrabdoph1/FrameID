import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminShell } from "@/components/layout/admin-shell";
import "@/app/admin.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? headersList.get("next-url") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
