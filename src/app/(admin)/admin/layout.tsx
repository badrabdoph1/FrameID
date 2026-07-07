import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import "@/app/admin.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
