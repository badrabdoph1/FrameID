import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardScrollReset } from "@/components/layout/dashboard-scroll-reset";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RenderingSafetyMode } from "@/components/layout/rendering-safety-mode";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import "@/app/android-rendering-safety.css";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  manifest: "/manifest-dashboard.webmanifest",
  robots: {
    index: false,
    follow: false
  }
};

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
      <RenderingSafetyMode />
      <DashboardScrollReset />
      <DashboardShell siteSlug={session.site.slug}>{children}</DashboardShell>
      <PwaInstallButton context="dashboard" />
    </>
  );
}
