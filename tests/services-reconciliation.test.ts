import { describe, expect, it, vi } from "vitest";

import { runServicesReconciliation } from "@/modules/services-platform/reconciliation";

describe("services reconciliation", () => {
  it("recovers expired leases and advances expired subscription periods", async () => {
    const prisma = {
      catalogOffering: { findFirst: vi.fn().mockResolvedValue(null) },
      servicesOutboxEvent: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
        upsert: vi.fn().mockResolvedValue({}),
      },
      serviceSubscription: {
        findMany: vi.fn().mockResolvedValue([
          { id: "cancel", status: "ACTIVE", cancelAtPeriodEnd: true, currentPeriodEnd: new Date("2026-07-01"), gracePeriodEndsAt: null },
          { id: "due", status: "ACTIVE", cancelAtPeriodEnd: false, currentPeriodEnd: new Date("2026-07-01"), gracePeriodEndsAt: null },
          { id: "grace", status: "GRACE_PERIOD", cancelAtPeriodEnd: false, currentPeriodEnd: new Date("2026-06-01"), gracePeriodEndsAt: new Date("2026-07-10") },
        ]),
        update: vi.fn().mockResolvedValue({}),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ tenantId: "tenant", acquisitionId: "acq-source" }),
      },
      trialGrant: { findMany: vi.fn().mockResolvedValue([{ id: "trial" }]), update: vi.fn().mockResolvedValue({ tenantId: "tenant" }) },
      acquisition: { findMany: vi.fn().mockResolvedValue([{ id: "acq", correlationId: "corr" }]) },
      entitlement: { count: vi.fn().mockResolvedValue(0), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      productInstance: { count: vi.fn().mockResolvedValue(0), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    Object.assign(prisma, { $transaction: async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma) });

    const report = await runServicesReconciliation(prisma as never, new Date("2026-07-22T00:00:00.000Z"));

    expect(report.repaired).toMatchObject({ expiredLeases: 2, expiredSubscriptions: 2, pastDueSubscriptions: 1, expiredTrials: 1, fulfillmentRequests: 1 });
    expect(prisma.servicesOutboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { deduplicationKey: "reconcile:fulfillment:acq" } }));
  });
});
