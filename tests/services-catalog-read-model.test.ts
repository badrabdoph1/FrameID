import { describe, expect, it } from "vitest";

import { buildCatalogReadModel } from "@/modules/services-platform/catalog-read-model";

describe("customer catalog read model", () => {
  it("selects the current market price and maps beta/coming-soon states without exposing internal policy", () => {
    const result = buildCatalogReadModel({
      context: { tenantId: "tenant_1", country: "EG", language: "ar", planCodes: ["PRO"] },
      marketCode: "EG",
      currency: "EGP",
      now: new Date("2026-07-22T12:00:00.000Z"),
      products: [{
        id: "product_1",
        code: "gallery",
        name: "Gallery",
        shortDescription: "Professional gallery",
        description: null,
        category: "gallery",
        tags: ["photos"],
        media: [],
        releaseStage: "BETA",
        accessTier: "STANDARD",
        eligibilityPolicy: null,
        sortOrder: 1,
        isFeatured: true,
        offerings: [{
          id: "offering_1",
          code: "gallery-beta",
          name: "Beta",
          shortDescription: "Beta access",
          description: null,
          type: "PLAN",
          salesMode: "REQUEST",
          releaseStage: "BETA",
          accessTier: "STANDARD",
          eligibilityPolicy: { all: [{ field: "planCodes", operator: "HAS", value: "PRO" }] },
          sortOrder: 1,
          prices: [
            { id: "global", amount: 2000, currency: "EGP", marketCode: "GLOBAL", billingInterval: "MONTHLY", effectiveFrom: new Date("2026-01-01"), effectiveTo: null },
            { id: "eg", amount: 1500, currency: "EGP", marketCode: "EG", billingInterval: "MONTHLY", effectiveFrom: new Date("2026-07-01"), effectiveTo: null },
          ],
          capabilityKeys: ["gallery.access"],
          capabilities: [{ capabilityId: "capability", capabilityKey: "gallery.access", value: true }],
          bundleComponents: [{ offeringId: "component", offeringCode: "component", offeringName: "Component", quantity: 1, required: true }],
          trialPolicies: [{ id: "trial", durationDays: 14, usageLimit: null, usageCapabilityKey: null, graceDays: 0, requiresPaymentMethod: false, isActive: true }],
        }],
      }],
    });

    expect(result.products[0]).toMatchObject({ code: "gallery", beta: true, comingSoon: false, featured: true });
    expect(result.products[0].offerings[0]).toMatchObject({
      displayPrice: { amount: 1500, currency: "EGP", billingInterval: "MONTHLY" },
      ctaMode: "JOIN_BETA",
      eligible: true,
      capabilities: [{ capabilityId: "capability", capabilityKey: "gallery.access", value: true }],
      trialPolicies: [{ id: "trial", durationDays: 14 }],
    });
  });

  it("removes products denied by targeting policy", () => {
    const result = buildCatalogReadModel({
      context: { tenantId: "tenant_1", country: "EG" },
      marketCode: "EG",
      currency: "EGP",
      now: new Date(),
      products: [{
        id: "hidden",
        code: "hidden",
        name: "Hidden",
        shortDescription: "Hidden",
        description: null,
        category: "other",
        tags: [],
        media: null,
        releaseStage: "GA",
        accessTier: "STANDARD",
        eligibilityPolicy: { deny: [{ field: "tenantId", operator: "EQ", value: "tenant_1" }] },
        sortOrder: 0,
        isFeatured: false,
        offerings: [],
      }],
    });

    expect(result.products).toEqual([]);
  });

  it("keeps premium offers discoverable but not purchasable without the required access tier", () => {
    const result = buildCatalogReadModel({
      context: { tenantId: "tenant", accessTiers: ["STANDARD"] },
      marketCode: "EG",
      currency: "EGP",
      now: new Date("2026-07-22T12:00:00.000Z"),
      products: [{
        id: "premium", code: "premium", name: "Premium", shortDescription: "Premium", description: null,
        category: "premium", tags: [], media: [], releaseStage: "GA", accessTier: "PREMIUM", eligibilityPolicy: null,
        sortOrder: 0, isFeatured: true,
        offerings: [{
          id: "premium-offer", code: "premium-offer", name: "Premium", shortDescription: "Premium", description: null,
          type: "PLAN", salesMode: "SELF_SERVE", releaseStage: "GA", accessTier: "PREMIUM", eligibilityPolicy: null,
          sortOrder: 0, prices: [], capabilityKeys: ["premium.access"],
        }],
      }],
    });

    expect(result.products[0]).toMatchObject({ eligible: false });
    expect(result.products[0].offerings[0]).toMatchObject({ eligible: false, purchasable: false, ctaMode: "REQUEST_ACCESS", reasonCodes: ["ACCESS_TIER_REQUIRED"] });
  });
});
