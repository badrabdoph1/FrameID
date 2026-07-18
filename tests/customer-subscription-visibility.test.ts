import { describe, expect, it } from "vitest";

import {
  createCustomerSubscriptionVisibilityService,
  type CustomerSubscriptionVisibilityRepository,
} from "@/modules/admin/customers/customer-subscription-visibility";
import {
  defaultSubscriptionExperienceDefaults,
  normalizeSubscriptionExperienceOverride,
  type SubscriptionExperienceOverride,
} from "@/modules/subscription/subscription-experience";

function createFake(initial: SubscriptionExperienceOverride | null = null) {
  let stored = initial;
  const audits: Array<{ action: string; metadata: Record<string, unknown> }> = [];
  const repository: CustomerSubscriptionVisibilityRepository = {
    async getDefaults() {
      return {
        defaults: defaultSubscriptionExperienceDefaults,
        sourceFallbackUsed: false,
      };
    },
    async getOverride() {
      return stored;
    },
    async persist(input) {
      stored = input.override;
      audits.push({ action: input.audit.action, metadata: input.audit.metadata });
    },
  };
  return { repository, audits, getStored: () => stored };
}

describe("customer subscription visibility service", () => {
  it("updates one bucket visibility and audits the effective decision", async () => {
    const fake = createFake(normalizeSubscriptionExperienceOverride({
      trial: { message: { title: "عنوان خاص" } },
      active: { message: { enabled: false } },
    }));
    const service = createCustomerSubscriptionVisibilityService(fake.repository);

    const result = await service.updateVisibility({
      tenantId: "tenant-1",
      bucket: "trial",
      preference: "hide",
      actor: { id: "admin-1", name: "بدر" },
      now: new Date("2026-07-18T10:00:00.000Z"),
    });

    expect(result.visibility.effective).toBe("hidden");
    expect(result.visibility.source).toBe("customer-override");
    expect(fake.getStored()?.trial?.message).toEqual({ enabled: false, title: "عنوان خاص" });
    expect(fake.getStored()?.active?.message?.enabled).toBe(false);
    expect(fake.audits[0]).toMatchObject({
      action: "CUSTOMER_SUBSCRIPTION_CARD_VISIBILITY_UPDATED",
      metadata: {
        tenantId: "tenant-1",
        bucket: "trial",
        previousPreference: "inherit",
        nextPreference: "hide",
        previousEffective: "visible",
        nextEffective: "hidden",
      },
    });
  });

  it("clears every bucket override in one explicit audited action", async () => {
    const fake = createFake(normalizeSubscriptionExperienceOverride({
      trial: { message: { enabled: false } },
      rejected: { action: { kind: "support", label: "تواصل معنا" } },
    }));
    const service = createCustomerSubscriptionVisibilityService(fake.repository);

    const result = await service.clearAll({
      tenantId: "tenant-1",
      actor: { id: "admin-2", name: "سارة" },
    });

    expect(result.clearedBuckets).toEqual(["trial", "rejected"]);
    expect(fake.getStored()).toBeNull();
    expect(fake.audits[0]).toMatchObject({
      action: "CUSTOMER_SUBSCRIPTION_EXPERIENCE_OVERRIDES_CLEARED",
      metadata: { tenantId: "tenant-1", clearedBuckets: ["trial", "rejected"] },
    });
  });
});
