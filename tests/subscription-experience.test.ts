import { describe, expect, it } from "vitest";

import {
  defaultSubscriptionExperienceDefaults,
  deriveSubscriptionExperienceState,
  normalizeSubscriptionExperienceOverride,
  resolveSubscriptionExperience,
} from "@/modules/subscription/subscription-experience";

describe("subscription experience", () => {
  it("gives tenant override priority over defaults", () => {
    const resolved = resolveSubscriptionExperience({
      defaults: defaultSubscriptionExperienceDefaults,
      override: normalizeSubscriptionExperienceOverride({
        trial: {
          message: {
            title: "رسالة خاصة",
            description: "هذا عميل له استثناء خاص.",
            tone: "danger",
          },
          timer: { enabled: false },
          action: {
            kind: "custom-link",
            label: "ادفع الآن",
            href: "https://example.com/pay",
          },
        },
      }),
      context: {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: new Date("2026-07-20T00:00:00.000Z"),
        subscriptionEndsAt: new Date("2026-07-20T00:00:00.000Z"),
      },
      now: new Date("2026-07-10T00:00:00.000Z"),
    });

    expect(resolved.source).toBe("override");
    expect(resolved.message.title).toBe("رسالة خاصة");
    expect(resolved.timer.enabled).toBe(false);
    expect(resolved.action.kind).toBe("custom-link");
    expect(resolved.action.href).toBe("https://example.com/pay");
  });

  it("derives pending review before generic trial messaging", () => {
    const derived = deriveSubscriptionExperienceState(
      {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        latestPaymentRequestStatus: "UNDER_REVIEW",
        trialEndsAt: new Date("2026-07-20T00:00:00.000Z"),
        subscriptionEndsAt: new Date("2026-07-20T00:00:00.000Z"),
      },
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(derived.state).toBe("pending-review");
    expect(derived.bucket).toBe("pendingReview");
  });

  it("marks near-end trials as trial-ending-soon while still using the trial bucket", () => {
    const derived = deriveSubscriptionExperienceState(
      {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        latestPaymentRequestStatus: null,
        trialEndsAt: new Date("2026-07-12T00:00:00.000Z"),
        subscriptionEndsAt: new Date("2026-07-12T00:00:00.000Z"),
      },
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(derived.state).toBe("trial-ending-soon");
    expect(derived.bucket).toBe("trial");
    expect(derived.daysRemaining).toBe(2);
  });
});
