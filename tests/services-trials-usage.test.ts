import { describe, expect, it } from "vitest";

import { createTrialService, type TrialRepository } from "@/modules/services-platform/trial-service";
import { createUsageService, UsageLimitExceededError, type UsageRepository } from "@/modules/services-platform/usage-service";

describe("trial grants and usage limits", () => {
  it("creates a time-and-usage bounded trial once per tenant", async () => {
    const repository: TrialRepository = {
      async getPolicy() { return { id: "policy_1", productId: "product_1", offeringId: "offering_1", durationDays: 14, usageLimit: 10, usageCapabilityKey: "ai.credits", graceDays: 2, oncePerTenant: true, isActive: true, capabilities: [] }; },
      async hasPreviousGrant() { return false; },
      async createGrant(input) { return { id: "trial_1", status: "ACTIVE", startsAt: input.startsAt, endsAt: input.endsAt, graceEndsAt: input.graceEndsAt, usageLimit: input.usageLimit }; },
    };
    const service = createTrialService(repository, () => new Date("2026-07-22T00:00:00.000Z"));

    await expect(service.start({ tenantId: "tenant_1", policyId: "policy_1", idempotencyKey: "trial_1" })).resolves.toMatchObject({
      endsAt: new Date("2026-08-05T00:00:00.000Z"),
      graceEndsAt: new Date("2026-08-07T00:00:00.000Z"),
      usageLimit: 10,
    });
  });

  it("grants offering capabilities until the trial grace boundary", async () => {
    const grants: Array<{ capabilityKey: string; sourceId: string; endsAt: string | null }> = [];
    const repository: TrialRepository = {
      async getPolicy() { return { id: "policy", productId: "product", offeringId: "offering", durationDays: 7, usageLimit: null, usageCapabilityKey: null, graceDays: 2, oncePerTenant: true, isActive: true, capabilities: [{ capabilityId: "cap", capabilityKey: "gallery.access", value: true, quantity: null }] }; },
      async hasPreviousGrant() { return false; },
      async createGrant(input) { return { id: "trial_1", status: "ACTIVE", startsAt: input.startsAt, endsAt: input.endsAt, graceEndsAt: input.graceEndsAt, usageLimit: input.usageLimit }; },
    };
    const service = createTrialService(repository, () => new Date("2026-07-22T00:00:00.000Z"), {
      async grantEntitlement(input) { grants.push({ capabilityKey: input.capabilityKey, sourceId: input.sourceId, endsAt: input.endsAt?.toISOString() ?? null }); },
    });
    await service.start({ tenantId: "tenant", policyId: "policy", idempotencyKey: "trial-start" });
    expect(grants).toEqual([{ capabilityKey: "gallery.access", sourceId: "trial_1", endsAt: "2026-07-31T00:00:00.000Z" }]);
  });

  it("rejects a second once-per-tenant trial", async () => {
    const repository: TrialRepository = {
      async getPolicy() { return { id: "p", productId: null, offeringId: "o", durationDays: 7, usageLimit: null, usageCapabilityKey: null, graceDays: 0, oncePerTenant: true, isActive: true, capabilities: [] }; },
      async hasPreviousGrant() { return true; }, async createGrant() { throw new Error("unused"); },
    };
    await expect(createTrialService(repository).start({ tenantId: "t", policyId: "p", idempotencyKey: "again" })).rejects.toThrow(/already used/i);
  });

  it("records usage idempotently and fails closed when the entitlement limit would be exceeded", async () => {
    const repository: UsageRepository = {
      async consume(input) {
        if (input.idempotencyKey === "over") throw new UsageLimitExceededError("ai.credits", 10, 11);
        return { consumed: 7, limit: 10, duplicate: input.idempotencyKey === "same" };
      },
    };
    const service = createUsageService(repository);
    await expect(service.consume({ tenantId: "t", capabilityKey: "ai.credits", amount: 2, idempotencyKey: "use_1" })).resolves.toEqual({ consumed: 7, remaining: 3, duplicate: false });
    await expect(service.consume({ tenantId: "t", capabilityKey: "ai.credits", amount: 1, idempotencyKey: "over" })).rejects.toBeInstanceOf(UsageLimitExceededError);
  });
});
