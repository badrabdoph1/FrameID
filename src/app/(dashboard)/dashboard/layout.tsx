import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <DashboardShell siteSlug={session.site.slug}>{children}</DashboardShell>
      <PwaInstallButton context="dashboard" />
    </>
  );
}
