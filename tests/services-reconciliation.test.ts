import { describe, expect, it, vi } from "vitest";

import { runServicesReconciliation } from "@/modules/services-platform/reconciliation";

describe("services reconciliation", () => {
  it("recovers expired leases and advances expired subscription periods", async () => {
    const prisma = {
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
      },
      acquisition: { findMany: vi.fn().mockResolvedValue([{ id: "acq", correlationId: "corr" }]) },
      entitlement: { count: vi.fn().mockResolvedValue(0) },
      productInstance: { count: vi.fn().mockResolvedValue(0) },
    };

    const report = await runServicesReconciliation(prisma as never, new Date("2026-07-22T00:00:00.000Z"));

    expect(report.repaired).toMatchObject({ expiredLeases: 2, expiredSubscriptions: 2, pastDueSubscriptions: 1, fulfillmentRequests: 1 });
    expect(prisma.servicesOutboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { deduplicationKey: "reconcile:fulfillment:acq" } }));
  });
});
