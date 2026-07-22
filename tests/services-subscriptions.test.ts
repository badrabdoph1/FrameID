import { describe, expect, it } from "vitest";

import { createServiceSubscriptionService, type ServiceSubscriptionRepository } from "@/modules/services-platform/subscription-service";

describe("multiple service subscriptions", () => {
  it("renews one subscription independently and preserves the others", async () => {
    const events: string[] = [];
    const repository: ServiceSubscriptionRepository = {
      async getById() { return { id: "sub_ai", tenantId: "tenant_1", status: "ACTIVE", currentPeriodStart: new Date("2026-07-01"), currentPeriodEnd: new Date("2026-08-01"), gracePeriodEndsAt: null, cancelAtPeriodEnd: false }; },
      async update(input) { events.push(`${input.id}:${input.status}:${input.currentPeriodEnd?.toISOString()}`); return { id: input.id, status: input.status }; },
    };
    const service = createServiceSubscriptionService(repository);
    await service.renew({ subscriptionId: "sub_ai", periodStart: new Date("2026-08-01"), periodEnd: new Date("2026-09-01"), idempotencyKey: "renew_ai_aug" });
    expect(events).toEqual(["sub_ai:ACTIVE:2026-09-01T00:00:00.000Z"]);
  });

  it("supports grace period, end-of-period cancellation and expiry transitions", async () => {
    let status: "PAST_DUE" | "GRACE_PERIOD" | "ACTIVE" = "PAST_DUE";
    const repository: ServiceSubscriptionRepository = {
      async getById() { return { id: "sub", tenantId: "t", status, currentPeriodStart: new Date(), currentPeriodEnd: new Date(), gracePeriodEndsAt: null, cancelAtPeriodEnd: false }; },
      async update(input) { status = input.status as typeof status; return { id: input.id, status: input.status }; },
    };
    const service = createServiceSubscriptionService(repository, () => new Date("2026-07-22"));
    await expect(service.enterGrace({ subscriptionId: "sub", graceDays: 3, idempotencyKey: "grace" })).resolves.toMatchObject({ status: "GRACE_PERIOD" });
    status = "ACTIVE";
    await expect(service.cancel({ subscriptionId: "sub", atPeriodEnd: true, reason: "CUSTOMER_REQUEST", idempotencyKey: "cancel" })).resolves.toMatchObject({ status: "ACTIVE" });
  });
});
