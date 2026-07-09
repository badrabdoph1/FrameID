import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import "@/app/admin.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminShell>{children}</AdminShell>
      <PwaInstallButton context="admin" />
    </>
  );
}
