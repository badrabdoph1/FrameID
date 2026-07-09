import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import "@/app/admin.css";

export const metadata: Metadata = {
  title: "إدارة FrameID",
  robots: {
    index: false,
    follow: false
  }
};

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
