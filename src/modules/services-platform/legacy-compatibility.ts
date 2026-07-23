import { Prisma, type PrismaClient } from "@prisma/client";

export async function syncLegacyPricingEntitlements(prisma: PrismaClient, input: { tenantId?: string; now?: Date } = {}) {
  const now = input.now ?? new Date();
  const offering = await prisma.catalogOffering.findFirst({
    where: { code: "pricing-site-core", publicationStatus: "PUBLISHED", deletedAt: null },
    include: { product: { select: { id: true, code: true } }, capabilities: { include: { capability: true } } },
  });
  if (!offering?.product) return { synchronized: 0, revoked: 0 };
  const pendingSubscriptionIds = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT subscription."id"
    FROM "Subscription" AS subscription
    WHERE subscription."deletedAt" IS NULL
      AND subscription."status" IN ('TRIAL', 'ACTIVE')
      AND subscription."currentPeriodEnd" > ${now}
      ${input.tenantId ? Prisma.sql`AND subscription."tenantId" = ${input.tenantId}` : Prisma.empty}
      AND NOT EXISTS (
        SELECT 1
        FROM "Entitlement" AS entitlement
        WHERE entitlement."sourceType" = 'LEGACY_SUBSCRIPTION'
          AND entitlement."sourceId" = subscription."id"
          AND entitlement."status" = 'ACTIVE'
          AND entitlement."endsAt" = subscription."currentPeriodEnd"
      )
    ORDER BY subscription."updatedAt" ASC
    LIMIT 5000
  `);
  const subscriptions = await prisma.subscription.findMany({
    where: {
      id: { in: pendingSubscriptionIds.map((item) => item.id) },
    },
    include: { tenant: { select: { sites: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 1, select: { id: true } } } } },
  });
  for (const subscription of subscriptions) {
    await prisma.$transaction(async (tx) => {
      for (const item of offering.capabilities) {
        const capabilityValue = item.value === null
          ? Prisma.JsonNull
          : item.value as Prisma.InputJsonValue;
        await tx.entitlement.upsert({
          where: { tenantId_capabilityKey_sourceType_sourceId: { tenantId: subscription.tenantId, capabilityKey: item.capability.key, sourceType: "LEGACY_SUBSCRIPTION", sourceId: subscription.id } },
          update: { status: "ACTIVE", productId: offering.product!.id, offeringId: offering.id, capabilityId: item.capability.id, value: capabilityValue, startsAt: subscription.currentPeriodStart, endsAt: subscription.currentPeriodEnd, revokedAt: null, revocationReason: null },
          create: { tenantId: subscription.tenantId, productId: offering.product!.id, offeringId: offering.id, capabilityId: item.capability.id, capabilityKey: item.capability.key, sourceType: "LEGACY_SUBSCRIPTION", sourceId: subscription.id, status: "ACTIVE", value: capabilityValue, startsAt: subscription.currentPeriodStart, endsAt: subscription.currentPeriodEnd },
        });
      }
      await tx.productInstance.upsert({
        where: { tenantId_instanceKey: { tenantId: subscription.tenantId, instanceKey: `pricing-site:legacy:${subscription.id}` } },
        update: { status: "ACTIVE", expiresAt: subscription.currentPeriodEnd, suspendedAt: null, activatedAt: subscription.activatedAt ?? subscription.currentPeriodStart },
        create: { tenantId: subscription.tenantId, productId: offering.product!.id, instanceKey: `pricing-site:legacy:${subscription.id}`, externalRef: subscription.tenant.sites[0]?.id ?? null, configuration: { compatibility: "legacy-subscription" } as Prisma.InputJsonValue, status: "ACTIVE", activatedAt: subscription.activatedAt ?? subscription.currentPeriodStart, expiresAt: subscription.currentPeriodEnd },
      });
      await tx.servicesOutboxEvent.upsert({
        where: { deduplicationKey: `legacy-subscription:${subscription.id}:entitlements:${subscription.currentPeriodEnd.toISOString()}` },
        update: {},
        create: { aggregateType: "LegacySubscription", aggregateId: subscription.id, eventName: "services.compatibility.entitlements.synchronized", payload: { subscriptionId: subscription.id, tenantId: subscription.tenantId }, deduplicationKey: `legacy-subscription:${subscription.id}:entitlements:${subscription.currentPeriodEnd.toISOString()}` },
      });
    });
  }
  const [revocationCandidates, instanceCandidates] = await Promise.all([
    prisma.entitlement.findMany({
      where: { ...(input.tenantId ? { tenantId: input.tenantId } : {}), sourceType: "LEGACY_SUBSCRIPTION", status: { in: ["ACTIVE", "SUSPENDED"] } },
      select: { sourceId: true },
      distinct: ["sourceId"],
      take: 5_000,
    }),
    prisma.productInstance.findMany({
    where: {
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      productId: offering.product.id,
      instanceKey: { startsWith: "pricing-site:legacy:" },
      status: { in: ["PROVISIONING", "ACTIVE", "SUSPENDED"] },
    },
    select: { id: true, instanceKey: true },
    take: 5_000,
    }),
  ]);
  const candidateSourceIds = [...new Set([
    ...revocationCandidates.map((item) => item.sourceId),
    ...instanceCandidates.map((instance) => instance.instanceKey.slice("pricing-site:legacy:".length)),
  ])];
  const stillActive = candidateSourceIds.length ? await prisma.subscription.findMany({
    where: { id: { in: candidateSourceIds }, deletedAt: null, status: { in: ["TRIAL", "ACTIVE"] }, currentPeriodEnd: { gt: now } },
    select: { id: true },
  }) : [];
  const activeSourceIds = new Set(stillActive.map((item) => item.id));
  const inactiveSourceIds = candidateSourceIds.filter((id) => !activeSourceIds.has(id));
  const inactiveInstanceIds = instanceCandidates
    .filter((instance) => inactiveSourceIds.includes(instance.instanceKey.slice("pricing-site:legacy:".length)))
    .map((instance) => instance.id);
  const revoked = await prisma.$transaction(async (tx) => {
    const entitlements = inactiveSourceIds.length
      ? await tx.entitlement.updateMany({
          where: { ...(input.tenantId ? { tenantId: input.tenantId } : {}), sourceType: "LEGACY_SUBSCRIPTION", sourceId: { in: inactiveSourceIds }, status: { in: ["ACTIVE", "SUSPENDED"] } },
          data: { status: "REVOKED", revokedAt: now, revocationReason: "LEGACY_SUBSCRIPTION_INACTIVE" },
        })
      : { count: 0 };
    const instances = inactiveInstanceIds.length
      ? await tx.productInstance.updateMany({ where: { id: { in: inactiveInstanceIds } }, data: { status: "EXPIRED", expiresAt: now } })
      : { count: 0 };
    if (entitlements.count || instances.count) {
      const scope = input.tenantId ?? "all";
      await tx.servicesOutboxEvent.create({
        data: {
          aggregateType: "LegacySubscriptionCompatibility",
          aggregateId: scope,
          eventName: "services.compatibility.entitlements.revoked",
          payload: { tenantId: input.tenantId ?? null, revokedEntitlements: entitlements.count, expiredInstances: instances.count },
          deduplicationKey: `legacy-subscription:${scope}:revoked:${now.toISOString()}`,
        },
      });
    }
    return entitlements;
  });
  return { synchronized: subscriptions.length, revoked: revoked.count, expiredInstances: inactiveInstanceIds.length };
}
