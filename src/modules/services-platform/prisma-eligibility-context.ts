import { Prisma, type PrismaClient } from "@prisma/client";

import type { EligibilityContext } from "./eligibility";

function accessTiersFromEntitlement(capabilityKey: string, value: Prisma.JsonValue) {
  if (capabilityKey === "platform.access_tier") {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  }
  const prefix = "access_tier.";
  return capabilityKey.startsWith(prefix) ? [capabilityKey.slice(prefix.length)] : [];
}

export async function buildPrismaEligibilityContext(
  prisma: PrismaClient,
  tenantId: string,
  now = new Date(),
): Promise<EligibilityContext> {
  const [tenant, siteCount, activeInstances, legacySubscriptions, accessEntitlements, contact] = await Promise.all([
    prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null }, select: { createdAt: true, status: true } }),
    prisma.site.count({ where: { tenantId, deletedAt: null } }),
    prisma.productInstance.findMany({ where: { tenantId, status: "ACTIVE" }, include: { product: { select: { code: true } } } }),
    prisma.subscription.findMany({ where: { tenantId, deletedAt: null }, include: { plan: { select: { code: true } } } }),
    prisma.entitlement.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        startsAt: { lte: now },
        AND: [
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          { OR: [{ capabilityKey: "platform.access_tier" }, { capabilityKey: { startsWith: "access_tier." } }] },
        ],
      },
      select: { capabilityKey: true, value: true },
    }),
    prisma.contactProfile.findFirst({
      where: { site: { tenantId, deletedAt: null }, deletedAt: null, country: { not: null } },
      select: { country: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  if (!tenant) throw new Error("Tenant is not available.");
  const rawCountry = contact?.country?.trim().toUpperCase();
  const country = rawCountry?.length === 2 ? rawCountry : "EG";
  return {
    tenantId,
    planCodes: legacySubscriptions.flatMap((item) => item.plan?.code ? [item.plan.code] : []),
    customerType: "PHOTOGRAPHER",
    country,
    language: "ar",
    siteCount,
    activeProductCodes: activeInstances.map((item) => item.product.code),
    customerAgeDays: Math.floor((now.getTime() - tenant.createdAt.getTime()) / 86_400_000),
    accessTiers: [...new Set(["STANDARD", ...accessEntitlements.flatMap((item) => accessTiersFromEntitlement(item.capabilityKey, item.value))])],
    attributes: { tenantStatus: tenant.status },
  };
}
