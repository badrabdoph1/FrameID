import type { PrismaClient } from "@prisma/client";
import { syncLegacyPricingEntitlements } from "./legacy-compatibility";
import { createServicesPlatformRuntime } from "./runtime";

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function runServicesReconciliation(
  prisma: PrismaClient,
  now = new Date(),
  options: { requestOffering?: ReturnType<typeof createServicesPlatformRuntime>["acquisitions"]["requestOffering"] } = {},
) {
  const legacyCompatibility = await syncLegacyPricingEntitlements(prisma, { now });
  const expiredLeases = await prisma.servicesOutboxEvent.updateMany({
    where: { status: "PROCESSING", leaseExpiresAt: { lt: now } },
    data: { status: "PENDING", leaseOwner: null, leaseExpiresAt: null, availableAt: now },
  });
  const subscriptions = await prisma.serviceSubscription.findMany({
    where: { OR: [
      { status: "ACTIVE", currentPeriodEnd: { lte: now } },
      { status: "PAST_DUE", OR: [{ gracePeriodEndsAt: null }, { gracePeriodEndsAt: { lte: now } }] },
      { status: "GRACE_PERIOD", gracePeriodEndsAt: { lte: now } },
    ] },
    select: { id: true, status: true, cancelAtPeriodEnd: true, currentPeriodEnd: true, gracePeriodEndsAt: true },
  });
  let expiredSubscriptions = 0;
  let pastDueSubscriptions = 0;
  for (const subscription of subscriptions) {
    const transitioned = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ServiceSubscription" WHERE id = ${subscription.id} FOR UPDATE`;
      const source = await tx.serviceSubscription.findUniqueOrThrow({
        where: { id: subscription.id },
        select: { tenantId: true, acquisitionId: true, status: true, currentPeriodEnd: true, gracePeriodEndsAt: true, cancelAtPeriodEnd: true },
      });
      const activeDue = source.status === "ACTIVE" && source.currentPeriodEnd <= now;
      const graceDue = (source.status === "PAST_DUE" || source.status === "GRACE_PERIOD") && source.gracePeriodEndsAt != null && source.gracePeriodEndsAt <= now;
      const initializePastDueGrace = source.status === "PAST_DUE" && source.gracePeriodEndsAt == null;
      if (!activeDue && !graceDue && !initializePastDueGrace) return null;
      const expire = source.cancelAtPeriodEnd || graceDue;
      const targetStatus = expire ? "EXPIRED" : "PAST_DUE";
      const gracePeriodEndsAt = targetStatus === "PAST_DUE"
        ? source.gracePeriodEndsAt ?? new Date(now.getTime() + 3 * 86_400_000)
        : source.gracePeriodEndsAt;
      await tx.serviceSubscription.update({
        where: { id: subscription.id },
        data: expire ? { status: targetStatus, cancelledAt: source.cancelAtPeriodEnd ? now : undefined } : { status: targetStatus, gracePeriodEndsAt },
      });
      if (expire && source.acquisitionId) {
        await tx.entitlement.updateMany({
          where: { tenantId: source.tenantId, sourceType: "ACQUISITION", sourceId: source.acquisitionId, status: { in: ["ACTIVE", "SUSPENDED"] } },
          data: { status: "REVOKED", revokedAt: now, revocationReason: "SUBSCRIPTION_EXPIRED" },
        });
        await tx.productInstance.updateMany({
          where: { tenantId: source.tenantId, acquisitionId: source.acquisitionId, status: { in: ["PROVISIONING", "ACTIVE"] } },
          data: { status: "EXPIRED", expiresAt: now },
        });
      }
      const deduplicationKey = `reconcile:subscription:${subscription.id}:${targetStatus}:${source.currentPeriodEnd.toISOString()}`;
      await tx.servicesOutboxEvent.upsert({
        where: { deduplicationKey },
        update: {},
        create: { aggregateType: "ServiceSubscription", aggregateId: subscription.id, eventName: `services.subscription.${targetStatus.toLowerCase()}`, payload: { subscriptionId: subscription.id, tenantId: source.tenantId, acquisitionId: source.acquisitionId, toStatus: targetStatus }, deduplicationKey },
      });
      return targetStatus;
    });
    if (transitioned === "EXPIRED") expiredSubscriptions += 1;
    else if (transitioned === "PAST_DUE") pastDueSubscriptions += 1;
  }
  const expiredTrials = await prisma.trialGrant.findMany({
    where: { status: "ACTIVE", OR: [{ graceEndsAt: { lte: now } }, { graceEndsAt: null, endsAt: { lte: now } }] },
    select: { id: true },
    take: 500,
  });
  for (const trial of expiredTrials) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.trialGrant.update({ where: { id: trial.id }, data: { status: "EXPIRED" }, select: { tenantId: true } });
      await tx.entitlement.updateMany({
        where: { sourceType: "TRIAL_GRANT", sourceId: trial.id, status: { in: ["ACTIVE", "SUSPENDED"] } },
        data: { status: "EXPIRED", revokedAt: now, revocationReason: "TRIAL_EXPIRED" },
      });
      await tx.servicesOutboxEvent.upsert({
        where: { deduplicationKey: `reconcile:trial:${trial.id}:expired` },
        update: {},
        create: { aggregateType: "TrialGrant", aggregateId: trial.id, eventName: "services.trial.expired", payload: { trialGrantId: trial.id, tenantId: updated.tenantId }, deduplicationKey: `reconcile:trial:${trial.id}:expired` },
      });
    });
  }
  const staleBefore = new Date(now.getTime() - 15 * 60_000);
  const staleRuns = await prisma.fulfillmentRun.findMany({
    where: { status: "RUNNING", OR: [{ leaseExpiresAt: { lt: now } }, { leaseExpiresAt: null, updatedAt: { lt: staleBefore } }] },
    select: { id: true, acquisitionId: true },
    take: 500,
  });
  let recoveredFulfillmentRuns = 0;
  for (const run of staleRuns) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.fulfillmentRun.updateMany({
        where: { id: run.id, status: "RUNNING", OR: [{ leaseExpiresAt: { lt: now } }, { leaseExpiresAt: null, updatedAt: { lt: staleBefore } }] },
        data: { status: "FAILED", finishedAt: now, leaseOwner: null, leaseExpiresAt: null, lastError: "Fulfillment lease expired; scheduled for safe retry." },
      });
      if (updated.count !== 1) return;
      await tx.servicesOutboxEvent.upsert({
        where: { deduplicationKey: `reconcile:fulfillment-run:${run.id}:retry` },
        update: { status: "PENDING", availableAt: now, lastError: null },
        create: { aggregateType: "FulfillmentRun", aggregateId: run.id, eventName: "services.fulfillment.retry.requested", payload: { runId: run.id, acquisitionId: run.acquisitionId }, deduplicationKey: `reconcile:fulfillment-run:${run.id}:retry` },
      });
      recoveredFulfillmentRuns += 1;
    });
  }
  const completedRuns = await prisma.acquisition.findMany({
    where: { status: "FULFILLING", fulfillmentRuns: { some: { status: "SUCCEEDED" } } },
    select: { id: true, tenantId: true, correlationId: true },
    take: 500,
  });
  let finalizedAcquisitions = 0;
  for (const acquisition of completedRuns) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.acquisition.updateMany({ where: { id: acquisition.id, status: "FULFILLING" }, data: { status: "FULFILLED", fulfilledAt: now } });
      if (updated.count !== 1) return;
      await tx.servicesOutboxEvent.upsert({
        where: { deduplicationKey: `reconcile:acquisition:${acquisition.id}:fulfilled` },
        update: {},
        create: { aggregateType: "Acquisition", aggregateId: acquisition.id, eventName: "services.acquisition.fulfilled", payload: { acquisitionId: acquisition.id, tenantId: acquisition.tenantId, status: "FULFILLED" }, deduplicationKey: `reconcile:acquisition:${acquisition.id}:fulfilled`, correlationId: acquisition.correlationId },
      });
      finalizedAcquisitions += 1;
    });
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
  const communicationCandidates = await prisma.acquisition.findMany({
    where: {
      OR: [{ status: "DRAFT" }, { conversationId: { not: null } }],
      createdAt: { lt: new Date(now.getTime() - 5 * 60_000) },
    },
    select: { id: true, tenantId: true, offeringId: true, idempotencyKey: true, correlationId: true, conversationId: true, status: true, metadata: true },
    take: 500,
  });
  let recoveredConversations = 0;
  let recoveredContextReferences = 0;
  let unsafeCommunicationLinks = 0;
  let unrecoverableOrphans = 0;
  if (communicationCandidates.length) {
    const conversationIds = communicationCandidates.flatMap((item) => item.conversationId ? [item.conversationId] : []);
    const [conversations, contexts] = await Promise.all([
      prisma.communicationConversation.findMany({ where: { id: { in: conversationIds } }, select: { id: true, tenantId: true } }),
      prisma.communicationContextReference.findMany({
        where: { namespace: "services", entityType: "acquisition", entityId: { in: communicationCandidates.map((item) => item.id) }, relationKey: "primary" },
        select: { entityId: true },
      }),
    ]);
    const conversationTenants = new Map(conversations.map((item) => [item.id, item.tenantId]));
    const contextAcquisitions = new Set(contexts.map((item) => item.entityId));
    const requestOffering = options.requestOffering ?? createServicesPlatformRuntime(prisma).acquisitions.requestOffering;
    for (const acquisition of communicationCandidates) {
      const conversationTenant = acquisition.conversationId ? conversationTenants.get(acquisition.conversationId) : undefined;
      if (acquisition.conversationId && conversationTenant !== undefined) {
        if (conversationTenant !== acquisition.tenantId) {
          unsafeCommunicationLinks += 1;
          continue;
        }
        if (!contextAcquisitions.has(acquisition.id)) {
          await prisma.communicationContextReference.upsert({
            where: {
              conversationId_namespace_entityType_entityId_relationKey: {
                conversationId: acquisition.conversationId,
                namespace: "services",
                entityType: "acquisition",
                entityId: acquisition.id,
                relationKey: "primary",
              },
            },
            update: {},
            create: { conversationId: acquisition.conversationId, namespace: "services", entityType: "acquisition", entityId: acquisition.id, relationKey: "primary", sourceModule: "services" },
          });
          recoveredContextReferences += 1;
        }
        continue;
      }

      const metadata = metadataObject(acquisition.metadata);
      const userId = typeof metadata.requestedByUserId === "string" ? metadata.requestedByUserId : null;
      if (!userId) {
        unrecoverableOrphans += 1;
        continue;
      }
      if (acquisition.status !== "DRAFT" && acquisition.status !== "REQUESTED") {
        unrecoverableOrphans += 1;
        continue;
      }
      if (acquisition.status === "REQUESTED") {
        const reset = await prisma.acquisition.updateMany({
          where: { id: acquisition.id, status: "REQUESTED", conversationId: acquisition.conversationId },
          data: { status: "DRAFT", conversationId: null, requestedAt: null },
        });
        if (reset.count !== 1) continue;
      }
      await requestOffering({
        tenantId: acquisition.tenantId,
        userId,
        offeringId: acquisition.offeringId,
        idempotencyKey: acquisition.idempotencyKey,
        customerMessage: typeof metadata.customerMessage === "string" ? metadata.customerMessage : null,
      });
      recoveredConversations += 1;
    }
  }
  const [stuckOutbox, deadLetters, activeEntitlements, staleProvisioningInstances] = await Promise.all([
    prisma.servicesOutboxEvent.count({ where: { status: "PROCESSING", leaseExpiresAt: { lt: now } } }),
    prisma.servicesOutboxEvent.count({ where: { status: "DEAD_LETTER" } }),
    prisma.entitlement.count({ where: { status: "ACTIVE" } }),
    prisma.productInstance.count({ where: { status: "PROVISIONING", createdAt: { lt: new Date(now.getTime() - 60 * 60_000) } } }),
  ]);
  const degraded = deadLetters > 0 || stuckOutbox > 0 || staleProvisioningInstances > 0 || unsafeCommunicationLinks > 0 || unrecoverableOrphans > 0;
  return {
    status: degraded ? "DEGRADED" as const : "HEALTHY" as const,
    checkedAt: now.toISOString(),
    repaired: { expiredLeases: expiredLeases.count, expiredSubscriptions, pastDueSubscriptions, expiredTrials: expiredTrials.length, fulfillmentRequests: missingRuns.length, recoveredFulfillmentRuns, finalizedAcquisitions, recoveredConversations, recoveredContextReferences, legacyCompatibility },
    metrics: { activeEntitlements },
    anomalies: { stuckOutbox, deadLetters, staleProvisioningInstances, unsafeCommunicationLinks, unrecoverableOrphans },
  };
}
