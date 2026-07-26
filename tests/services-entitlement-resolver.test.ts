import { describe, expect, it } from "vitest";

import { resolveEntitlements } from "@/modules/services-platform/entitlement-resolver";

describe("entitlement resolver", () => {
  it("resolves multiple products and subscriptions with explicit aggregation policies", () => {
    const at = new Date("2026-07-22T12:00:00.000Z");
    const result = resolveEntitlements([
      { id: "base", capabilityKey: "storage.gb", status: "ACTIVE", value: 5, aggregationPolicy: "SUM", startsAt: new Date("2026-01-01"), endsAt: null },
      { id: "addon", capabilityKey: "storage.gb", status: "ACTIVE", value: 20, aggregationPolicy: "SUM", startsAt: new Date("2026-02-01"), endsAt: null },
      { id: "sites", capabilityKey: "pricing_site.sites", status: "ACTIVE", value: 1, aggregationPolicy: "MAX", startsAt: new Date("2026-01-01"), endsAt: null },
      { id: "sites-pro", capabilityKey: "pricing_site.sites", status: "ACTIVE", value: 3, aggregationPolicy: "MAX", startsAt: new Date("2026-03-01"), endsAt: null },
      { id: "expired", capabilityKey: "ai.credits", status: "ACTIVE", value: 100, aggregationPolicy: "SUM", startsAt: new Date("2026-01-01"), endsAt: new Date("2026-06-01") },
      { id: "suspended", capabilityKey: "premium.access", status: "SUSPENDED", value: true, aggregationPolicy: "BOOLEAN_OR", startsAt: new Date("2026-01-01"), endsAt: null },
    ], at);

    expect(result.capabilities["storage.gb"]).toMatchObject({ value: 25, sourceIds: ["base", "addon"] });
    expect(result.capabilities["pricing_site.sites"].value).toBe(3);
    expect(result.capabilities["ai.credits"]).toBeUndefined();
    expect(result.capabilities["premium.access"]).toBeUndefined();
  });

  it("keeps tenant, billing and product status out of capability resolution", () => {
    const result = resolveEntitlements([], new Date());
    expect(result).toEqual({ capabilities: {}, resolvedAt: expect.any(Date) });
    expect(result).not.toHaveProperty("tenantStatus");
    expect(result).not.toHaveProperty("billingStatus");
    expect(result).not.toHaveProperty("productStatus");
  });
});
