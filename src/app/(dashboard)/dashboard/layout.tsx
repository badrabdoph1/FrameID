import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardScrollReset } from "@/components/layout/dashboard-scroll-reset";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RenderingSafetyMode } from "@/components/layout/rendering-safety-mode";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { prisma } from "@/lib/prisma";
import type { RenderingSafetyConfig } from "@/lib/client/rendering-diagnostics";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import "@/app/android-rendering-safety.css";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  manifest: "/manifest-dashboard.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

function toRenderingConfig(value: unknown): RenderingSafetyConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const strings = (input: unknown) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : undefined;
  const signatures = Array.isArray(source.knownProblemSignatures)
    ? source.knownProblemSignatures.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const record = entry as Record<string, unknown>;
        const matchAll = strings(record.matchAll);
        if (!matchAll?.length) return [];
        return [{ matchAll, exclude: strings(record.exclude) }];
      })
    : undefined;

  return {
    forceUserIds: strings(source.forceUserIds),
    forceDeviceIds: strings(source.forceDeviceIds),
    knownProblemSignatures: signatures,
    fallbackWhenBackdropUnsupported: source.fallbackWhenBackdropUnsupported === true,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const flags = await prisma.featureFlag.findMany({
    where: {
      key: "safe-rendering",
      enabled: true,
      OR: [
        { scope: "PLATFORM", tenantId: null, siteId: null },
        { scope: "TENANT", tenantId: session.tenant.id },
        { scope: "SITE", siteId: session.site.id },
      ],
    },
    orderBy: { updatedAt: "asc" },
    select: { value: true },
  });

  const renderingConfig = flags.reduce<RenderingSafetyConfig>((current, flag) => {
    const next = toRenderingConfig(flag.value);
    return {
      forceUserIds: [...new Set([...(current.forceUserIds ?? []), ...(next.forceUserIds ?? [])])],
      forceDeviceIds: [...new Set([...(current.forceDeviceIds ?? []), ...(next.forceDeviceIds ?? [])])],
      knownProblemSignatures: [...(current.knownProblemSignatures ?? []), ...(next.knownProblemSignatures ?? [])],
      fallbackWhenBackdropUnsupported: current.fallbackWhenBackdropUnsupported === true || next.fallbackWhenBackdropUnsupported === true,
    };
  }, {});

  return (
    <>
      <RenderingSafetyMode config={renderingConfig} userId={session.user.id} />
      <DashboardScrollReset />
      <DashboardShell siteSlug={session.site.slug} hasSubscription={Boolean(session.subscription)}>{children}</DashboardShell>
      <PwaInstallButton context="dashboard" />
    </>
  );
}
