import { describe, expect, it, vi } from "vitest";

import { runServicesReconciliation } from "@/modules/services-platform/reconciliation";

describe("services reconciliation", () => {
  it("recovers expired leases and advances expired subscription periods", async () => {
    const requestOffering = vi.fn().mockResolvedValue({});
    const attachContext = vi.fn().mockResolvedValue({});
    const prisma = {
      catalogOffering: { findFirst: vi.fn().mockResolvedValue(null) },
      servicesOutboxEvent: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
        upsert: vi.fn().mockResolvedValue({}),
      },
      servicesReconciliationCheckpoint: {
        findUnique: vi.fn().mockResolvedValue({ cursorId: "cursor-before-page" }),
        upsert: vi.fn().mockResolvedValue({}),
      },
      serviceSubscription: {
        findMany: vi.fn().mockResolvedValue([
          { id: "cancel", status: "ACTIVE", cancelAtPeriodEnd: true, currentPeriodEnd: new Date("2026-07-01"), gracePeriodEndsAt: null },
          { id: "due", status: "ACTIVE", cancelAtPeriodEnd: false, currentPeriodEnd: new Date("2026-07-01"), gracePeriodEndsAt: null },
          { id: "grace", status: "GRACE_PERIOD", cancelAtPeriodEnd: false, currentPeriodEnd: new Date("2026-06-01"), gracePeriodEndsAt: new Date("2026-07-10") },
          { id: "past-due-expired", status: "PAST_DUE", cancelAtPeriodEnd: false, currentPeriodEnd: new Date("2026-06-01"), gracePeriodEndsAt: new Date("2026-07-10") },
          { id: "past-due-new", status: "PAST_DUE", cancelAtPeriodEnd: false, currentPeriodEnd: new Date("2026-07-20"), gracePeriodEndsAt: null },
        ]),
        update: vi.fn().mockResolvedValue({}),
        findUniqueOrThrow: vi.fn()
          .mockResolvedValueOnce({ tenantId: "tenant", acquisitionId: "acq-source", status: "ACTIVE", currentPeriodEnd: new Date("2026-07-01"), gracePeriodEndsAt: null, cancelAtPeriodEnd: true })
          .mockResolvedValueOnce({ tenantId: "tenant", acquisitionId: "acq-source", status: "ACTIVE", currentPeriodEnd: new Date("2026-07-01"), gracePeriodEndsAt: null, cancelAtPeriodEnd: false })
          .mockResolvedValueOnce({ tenantId: "tenant", acquisitionId: "acq-source", status: "GRACE_PERIOD", currentPeriodEnd: new Date("2026-06-01"), gracePeriodEndsAt: new Date("2026-07-10"), cancelAtPeriodEnd: false })
          .mockResolvedValueOnce({ tenantId: "tenant", acquisitionId: "acq-source", status: "PAST_DUE", currentPeriodEnd: new Date("2026-06-01"), gracePeriodEndsAt: new Date("2026-07-10"), cancelAtPeriodEnd: false })
          .mockResolvedValueOnce({ tenantId: "tenant", acquisitionId: "acq-source", status: "PAST_DUE", currentPeriodEnd: new Date("2026-07-20"), gracePeriodEndsAt: null, cancelAtPeriodEnd: false }),
      },
      trialGrant: { findMany: vi.fn().mockResolvedValue([{ id: "trial" }]), update: vi.fn().mockResolvedValue({ tenantId: "tenant" }) },
      fulfillmentRun: { findMany: vi.fn().mockResolvedValue([{ id: "stale-run", acquisitionId: "stale-acq" }]), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      acquisition: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{ id: "done-acq", tenantId: "tenant", correlationId: "done-corr" }])
          .mockResolvedValueOnce([{ id: "acq", correlationId: "corr" }])
          .mockResolvedValueOnce([
            { id: "orphan", tenantId: "tenant", offeringId: "offer", idempotencyKey: "request", correlationId: "orphan-corr", conversationId: null, status: "DRAFT", metadata: { requestedByUserId: "user", customerMessage: "help" } },
            { id: "linked", tenantId: "tenant", offeringId: "offer", idempotencyKey: "linked", correlationId: "linked-corr", conversationId: "conversation", status: "REQUESTED", metadata: {} },
          ])
          .mockResolvedValueOnce([{ id: "drift-acq" }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      communicationConversation: { findMany: vi.fn().mockResolvedValue([{ id: "conversation", tenantId: "tenant" }]) },
      communicationContextReference: { findMany: vi.fn().mockResolvedValue([{ conversationId: "old-conversation", entityId: "linked" }]), upsert: vi.fn() },
      entitlement: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      productInstance: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    Object.assign(prisma, { $queryRaw: vi.fn().mockResolvedValue([]) });
    Object.assign(prisma, { $transaction: async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma) });

    const report = await runServicesReconciliation(prisma as never, new Date("2026-07-22T00:00:00.000Z"), {
      requestOffering,
      attachContext,
      loadFulfillmentAcquisition: vi.fn().mockResolvedValue({
        id: "drift-acq", tenantId: "tenant", productId: "product", offeringId: "offer", workflowKey: "auto", workflowVersion: 1,
        status: "FULFILLED", instanceKey: "product:drift-acq", additionalActivations: [], billingInterval: "ONE_TIME",
        capabilities: [{ capabilityId: "cap", capabilityKey: "product.access", value: true }],
      }),
    });

    expect(report.repaired).toMatchObject({ expiredLeases: 2, expiredSubscriptions: 3, pastDueSubscriptions: 2, expiredTrials: 1, fulfillmentRequests: 1, recoveredFulfillmentRuns: 1, finalizedAcquisitions: 1, recoveredConversations: 1, recoveredContextReferences: 1 });
    expect(prisma.servicesOutboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { deduplicationKey: "reconcile:fulfillment:acq" } }));
    expect(prisma.servicesOutboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { deduplicationKey: "reconcile:fulfillment-run:stale-run:retry" } }));
    expect(prisma.servicesOutboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { deduplicationKey: "reconcile:acquisition:done-acq:fulfilled" } }));
    expect(requestOffering).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "tenant", userId: "user", idempotencyKey: "request" }));
    expect(attachContext).toHaveBeenCalledWith(expect.objectContaining({ conversationId: "conversation", context: expect.objectContaining({ entityId: "linked" }) }));
    expect(report.anomalies).toMatchObject({ entitlementDrift: 1, instanceDrift: 1, unreadableFulfillmentSnapshots: 0 });
    expect(prisma.acquisition.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { gt: "cursor-before-page" } }),
      orderBy: { id: "asc" },
      take: 500,
    }));
    expect(prisma.servicesReconciliationCheckpoint.upsert).toHaveBeenCalledTimes(2);
  });
});
