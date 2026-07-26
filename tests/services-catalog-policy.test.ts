import { describe, expect, it } from "vitest";

import { evaluateOfferingEligibility } from "@/modules/services-platform/eligibility";

const context = {
  tenantId: "tenant_1",
  planCodes: ["PRO"],
  customerType: "STUDIO",
  country: "EG",
  language: "ar",
  siteCount: 2,
  activeProductCodes: ["pricing-site"],
  customerAgeDays: 420,
  activityScore: 73,
};

describe("catalog eligibility policy", () => {
  it("supports deterministic targeting across plan, country, usage and active products", () => {
    const result = evaluateOfferingEligibility(context, {
      all: [
        { field: "country", operator: "EQ", value: "EG" },
        { field: "planCodes", operator: "HAS", value: "PRO" },
        { field: "siteCount", operator: "GTE", value: 2 },
        { field: "activeProductCodes", operator: "HAS", value: "pricing-site" },
      ],
      recommendWhen: [{ field: "activityScore", operator: "GTE", value: 70 }],
    });

    expect(result).toMatchObject({ visible: true, eligible: true, purchasable: true, recommended: true, ctaMode: "BUY" });
  });

  it("gives an explicit deny rule precedence over allow and returns explainable reason codes", () => {
    const result = evaluateOfferingEligibility(context, {
      all: [{ field: "country", operator: "IN", value: ["EG", "SA"] }],
      deny: [{ field: "tenantId", operator: "EQ", value: "tenant_1", reasonCode: "PRIVATE_BLOCK" }],
    });

    expect(result).toEqual({
      visible: false,
      eligible: false,
      purchasable: false,
      recommended: false,
      reasonCodes: ["PRIVATE_BLOCK"],
      ctaMode: "HIDDEN",
    });
  });

  it("fails closed for unknown fields or operators", () => {
    expect(evaluateOfferingEligibility(context, { all: [{ field: "unknown", operator: "EQ", value: true }] })).toMatchObject({ eligible: false });
    expect(evaluateOfferingEligibility(context, { all: [{ field: "country", operator: "MAGIC" as "EQ", value: "EG" }] })).toMatchObject({ eligible: false });
  });
});
