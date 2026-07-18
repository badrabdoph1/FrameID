import { describe, expect, it } from "vitest";

import {
  defaultSubscriptionExperienceDefaults,
  deriveSubscriptionExperienceState,
  getSubscriptionCardVisibilityPreference,
  normalizeSubscriptionExperienceOverride,
  resolveSubscriptionCardVisibility,
  resolveSubscriptionExperience,
  resolveSubscriptionExperienceForBucket,
  setSubscriptionCardVisibilityPreference,
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

  it("resolves card visibility from the customer preference before the global setting", () => {
    expect(resolveSubscriptionCardVisibility({ defaultEnabled: false, preference: "show" })).toEqual({
      preference: "show",
      effective: "visible",
      source: "customer-override",
    });
    expect(resolveSubscriptionCardVisibility({ defaultEnabled: true, preference: "hide" })).toEqual({
      preference: "hide",
      effective: "hidden",
      source: "customer-override",
    });
    expect(resolveSubscriptionCardVisibility({ defaultEnabled: false, preference: "inherit" })).toEqual({
      preference: "inherit",
      effective: "hidden",
      source: "global-default",
    });
    expect(resolveSubscriptionCardVisibility({
      defaultEnabled: true,
      preference: "inherit",
      sourceFallbackUsed: true,
    })).toEqual({
      preference: "inherit",
      effective: "visible",
      source: "system-fallback",
    });
  });

  it("keeps visibility on the global source when the customer only overrides copy", () => {
    const override = normalizeSubscriptionExperienceOverride({
      trial: { message: { title: "عنوان خاص" } },
    });
    const resolved = resolveSubscriptionExperienceForBucket({
      defaults: defaultSubscriptionExperienceDefaults,
      override,
      bucket: "trial",
      state: "trial",
      daysRemaining: 10,
    });

    expect(resolved.message.title).toBe("عنوان خاص");
    expect(resolved.visibility).toEqual({
      preference: "inherit",
      effective: "visible",
      source: "global-default",
    });
  });

  it("patches one bucket visibility without changing its other fields or other buckets", () => {
    const current = normalizeSubscriptionExperienceOverride({
      trial: {
        message: { enabled: true, title: "عنوان خاص" },
        timer: { enabled: false },
        action: { kind: "support", label: "مساعدة" },
      },
      active: { message: { enabled: false } },
    });

    const hidden = setSubscriptionCardVisibilityPreference({
      override: current,
      bucket: "trial",
      preference: "hide",
      actor: { id: "admin-1", name: "بدر" },
      now: new Date("2026-07-18T10:00:00.000Z"),
    });

    expect(hidden.trial?.message).toEqual({ enabled: false, title: "عنوان خاص" });
    expect(hidden.trial?.timer).toEqual({ enabled: false });
    expect(hidden.trial?.action).toEqual({ kind: "support", label: "مساعدة" });
    expect(hidden.trial?.metadata).toEqual({
      updatedAt: "2026-07-18T10:00:00.000Z",
      updatedByAdminId: "admin-1",
      updatedByAdminName: "بدر",
    });
    expect(hidden.active?.message?.enabled).toBe(false);

    const inherited = setSubscriptionCardVisibilityPreference({
      override: hidden,
      bucket: "trial",
      preference: "inherit",
      actor: { id: "admin-2", name: "سارة" },
      now: new Date("2026-07-18T11:00:00.000Z"),
    });

    expect(getSubscriptionCardVisibilityPreference(inherited.trial)).toBe("inherit");
    expect(inherited.trial?.message).toEqual({ title: "عنوان خاص" });
    expect(inherited.trial?.metadata?.updatedByAdminName).toBe("سارة");
    expect(inherited.active?.message?.enabled).toBe(false);
  });

  it("drops metadata-only buckets while preserving metadata for real overrides", () => {
    expect(normalizeSubscriptionExperienceOverride({
      trial: {
        metadata: {
          updatedAt: "2026-07-18T10:00:00.000Z",
          updatedByAdminId: "admin-1",
          updatedByAdminName: "بدر",
        },
      },
    }).trial).toBeUndefined();

    expect(normalizeSubscriptionExperienceOverride({
      trial: {
        message: { enabled: false },
        metadata: {
          updatedAt: "2026-07-18T10:00:00.000Z",
          updatedByAdminId: "admin-1",
          updatedByAdminName: "بدر",
        },
      },
    }).trial?.metadata?.updatedByAdminName).toBe("بدر");
  });
});
