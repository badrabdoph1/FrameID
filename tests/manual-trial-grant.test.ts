import { describe, expect, it, vi } from "vitest";

import { grantFreshTrialToTenants } from "@/modules/lifecycle/customer-lifecycle";

describe("manual fresh trial grant", () => {
  it("starts the new trial from execution time instead of account creation time", async () => {
    const tenantUpdate = vi.fn();
    const subscriptionUpdateMany = vi.fn();
    const siteUpdateMany = vi.fn();
    const auditCreate = vi.fn();

    const prisma = {
      tenant: {
        findMany: vi.fn().mockResolvedValue([{ id: "tenant_1" }]),
        update: tenantUpdate,
      },
      subscription: {
        updateMany: subscriptionUpdateMany,
      },
      site: {
        updateMany: siteUpdateMany,
      },
      auditLog: {
        create: auditCreate.mockResolvedValue(undefined),
      },
    } as never;

    const now = new Date("2026-07-13T10:30:00.000Z");
    const applied = await grantFreshTrialToTenants(prisma, ["tenant_1"], 3, now);

    expect(applied).toBe(1);
    expect(tenantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tenant_1" },
        data: expect.objectContaining({
          trialStartedAt: now,
          trialEndsAt: new Date("2026-07-16T10:30:00.000Z"),
          trialDays: 3,
          status: "TRIAL",
        }),
      }),
    );
    expect(subscriptionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant_1" },
        data: expect.objectContaining({
          currentPeriodStart: now,
          currentPeriodEnd: new Date("2026-07-16T10:30:00.000Z"),
          status: "TRIAL",
        }),
      }),
    );
  });
});
