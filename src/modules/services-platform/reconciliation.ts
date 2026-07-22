import type { PrismaClient } from "@prisma/client";

export async function runServicesReconciliation(prisma: PrismaClient, now = new Date()) {
  const expiredLeases = await prisma.servicesOutboxEvent.updateMany({
    where: { status: "PROCESSING", leaseExpiresAt: { lt: now } },
    data: { status: "PENDING", leaseOwner: null, leaseExpiresAt: null, availableAt: now },
  });
  const subscriptions = await prisma.serviceSubscription.findMany({
    where: { OR: [{ status: "ACTIVE", currentPeriodEnd: { lte: now } }, { status: "GRACE_PERIOD", gracePeriodEndsAt: { lte: now } }] },
    select: { id: true, status: true, cancelAtPeriodEnd: true, currentPeriodEnd: true, gracePeriodEndsAt: true },
  });
  let expiredSubscriptions = 0;
  let pastDueSubscriptions = 0;
  for (const subscription of subscriptions) {
    const expire = subscription.status === "GRACE_PERIOD" || subscription.cancelAtPeriodEnd;
    await prisma.serviceSubscription.update({
      where: { id: subscription.id },
      data: expire ? { status: "EXPIRED", cancelledAt: subscription.cancelAtPeriodEnd ? now : undefined } : { status: "PAST_DUE" },
    });
    if (expire) expiredSubscriptions += 1;
    else pastDueSubscriptions += 1;
  }
  const missingRuns = await prisma.acquisition.findMany({
    where: { status: { in: ["PAID", "ACCEPTED"] }, fulfillmentRuns: { none: {} } },
    select: { id: true, correlationId: true },
    take: 500,
  });
  for (const acquisition of missingRuns) {
    await prisma.servicesOutboxEvent.upsert({
      where: { deduplicationKey: `reconcile:fulfillment:${acquisition.id}` },
      update: { status: "PENDING", availableAt: now, lastError: null },
      create: { aggregateType: "Acquisition", aggregateId: acquisition.id, eventName: "services.fulfillment.requested", payload: { acquisitionId: acquisition.id }, deduplicationKey: `reconcile:fulfillment:${acquisition.id}`, correlationId: acquisition.correlationId },
    });
  }
  const [stuckOutbox, deadLetters, activeEntitlements, staleProvisioningInstances] = await Promise.all([
    prisma.servicesOutboxEvent.count({ where: { status: "PROCESSING", leaseExpiresAt: { lt: now } } }),
    prisma.servicesOutboxEvent.count({ where: { status: "DEAD_LETTER" } }),
    prisma.entitlement.count({ where: { status: "ACTIVE" } }),
    prisma.productInstance.count({ where: { status: "PROVISIONING", createdAt: { lt: new Date(now.getTime() - 60 * 60_000) } } }),
  ]);
  const degraded = deadLetters > 0 || stuckOutbox > 0 || staleProvisioningInstances > 0;
  return {
    status: degraded ? "DEGRADED" as const : "HEALTHY" as const,
    checkedAt: now.toISOString(),
    repaired: { expiredLeases: expiredLeases.count, expiredSubscriptions, pastDueSubscriptions, fulfillmentRequests: missingRuns.length },
    metrics: { activeEntitlements },
    anomalies: { stuckOutbox, deadLetters, staleProvisioningInstances },
  };
}
