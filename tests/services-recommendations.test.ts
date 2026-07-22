import { describe, expect, it } from "vitest";

import { evaluateRecommendationRules } from "@/modules/services-platform/recommendation-engine";

describe("rule-based service recommendations", () => {
  const context = {
    tenantId: "tenant_1",
    planCodes: ["PRO"],
    country: "EG",
    activeProductCodes: ["pricing-site"],
    ownedOfferingIds: [],
    dismissedRuleKeys: [],
  };

  it("produces explainable cross-sell and up-sell decisions ordered by priority and score", () => {
    const decisions = evaluateRecommendationRules({
      context,
      placement: "service_center",
      now: new Date("2026-07-22T12:00:00.000Z"),
      rules: [
        { id: "r1", key: "pricing-to-gallery", status: "ACTIVE", priority: 50, conditions: { all: [{ field: "activeProductCodes", operator: "HAS", value: "pricing-site" }] }, action: { offeringId: "gallery", score: 0.8 }, placements: ["service_center"], reasonCodes: ["COMPLEMENTS_PRICING_SITE"], startsAt: null, endsAt: null },
        { id: "r2", key: "pro-upgrade", status: "ACTIVE", priority: 80, conditions: { all: [{ field: "planCodes", operator: "HAS", value: "PRO" }] }, action: { offeringId: "premium", score: 0.6 }, placements: ["service_center"], reasonCodes: ["UPGRADE_FROM_PRO"], startsAt: null, endsAt: null },
      ],
    });
    expect(decisions.map((item) => item.offeringId)).toEqual(["premium", "gallery"]);
    expect(decisions[0]).toMatchObject({ ruleKey: "pro-upgrade", reasonCodes: ["UPGRADE_FROM_PRO"] });
  });

  it("respects placement, ownership, active windows and dismissals", () => {
    const decisions = evaluateRecommendationRules({
      context: { ...context, ownedOfferingIds: ["owned"], dismissedRuleKeys: ["dismissed"] },
      placement: "service_center",
      now: new Date("2026-07-22"),
      rules: [
        { id: "owned", key: "owned-rule", status: "ACTIVE", priority: 1, conditions: {}, action: { offeringId: "owned", score: 1 }, placements: ["service_center"], reasonCodes: [], startsAt: null, endsAt: null },
        { id: "dismissed", key: "dismissed", status: "ACTIVE", priority: 2, conditions: {}, action: { offeringId: "x", score: 1 }, placements: ["service_center"], reasonCodes: [], startsAt: null, endsAt: null },
        { id: "wrong", key: "wrong-placement", status: "ACTIVE", priority: 3, conditions: {}, action: { offeringId: "y", score: 1 }, placements: ["billing"], reasonCodes: [], startsAt: null, endsAt: null },
      ],
    });
    expect(decisions).toEqual([]);
  });
});
