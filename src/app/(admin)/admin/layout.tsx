import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { prisma } from "@/lib/prisma";
import { isServicesPlatformUiVisible } from "@/modules/services-platform/ui-visibility";
import "@/app/admin.css";

export const metadata: Metadata = {
  title: "إدارة FrameID",
  manifest: "/manifest-admin.webmanifest",
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
  const servicesPlatformVisible = await isServicesPlatformUiVisible(prisma);

  return (
    <>
      <AdminShell servicesPlatformVisible={servicesPlatformVisible}>{children}</AdminShell>
      <PwaInstallButton context="admin" />
    </>
  );
}
