import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscriptionExperienceAlert } from "@/app/(dashboard)/dashboard/billing/billing-client";
import {
  defaultSubscriptionExperienceDefaults,
  resolveSubscriptionExperience,
} from "@/modules/subscription/subscription-experience";

describe("SubscriptionExperienceAlert", () => {
  it("does not render a hidden subscription card", () => {
    const experience = resolveSubscriptionExperience({
      defaults: defaultSubscriptionExperienceDefaults,
      override: { trial: { message: { enabled: false } } },
      context: {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: new Date("2026-07-28T00:00:00.000Z"),
        subscriptionEndsAt: new Date("2026-07-28T00:00:00.000Z"),
      },
      now: new Date("2026-07-18T00:00:00.000Z"),
    });

    const { container } = render(
      <SubscriptionExperienceAlert
        experience={experience}
        fallbackDaysRemaining={10}
        submitted={false}
        status={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("حسابك تجريبي")).not.toBeInTheDocument();
  });
});
