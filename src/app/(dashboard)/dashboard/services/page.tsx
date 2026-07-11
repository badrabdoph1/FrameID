import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { ServicesClient } from "@/app/(dashboard)/dashboard/services/services-client";

export const metadata: Metadata = {
  title: "الباقات | FrameID",
};

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
};

export default async function DashboardServicesPage({
  searchParams,
}: ServicesPageProps) {
  const session = await getCurrentRequestSession();
  const { created, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const [packages, extras] = await Promise.all([
    prisma.package.findMany({
      where: { siteId: session.site.id, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.extraService.findMany({
      where: { siteId: session.site.id, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <ServicesClient
      packages={packages.map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: p.subtitle ?? undefined,
        priceAmount: p.priceAmount,
        currency: p.currency,
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
        isHighlighted: p.isHighlighted,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
      }))}
      extras={extras.map((extra) => ({
        id: extra.id,
        name: extra.name,
        description: extra.description,
        priceAmount: extra.priceAmount,
        currency: extra.currency,
        iconKey: extra.iconKey,
        isActive: extra.isActive,
        sortOrder: extra.sortOrder,
      }))}
      created={created}
      error={error}
    />
  );
}
