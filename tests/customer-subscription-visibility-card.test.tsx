import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CustomerSubscriptionVisibilityCard,
  type CustomerSubscriptionVisibilityRow,
} from "@/app/(admin)/admin/customers/[id]/components/customer-subscription-visibility-card";
import {
  defaultSubscriptionExperienceDefaults,
  resolveSubscriptionExperienceForBucket,
  subscriptionExperienceBucketDefinitions,
} from "@/modules/subscription/subscription-experience";

describe("CustomerSubscriptionVisibilityCard", () => {
  it("shows every state with its result, source, preview, audit metadata, and reset action", () => {
    const rows: CustomerSubscriptionVisibilityRow[] = subscriptionExperienceBucketDefinitions.map(
      (definition, index) => ({
        bucket: definition.value,
        label: definition.label,
        description: definition.description,
        isCurrent: definition.value === "trial",
        preference: index === 0 ? "hide" : "inherit",
        experience: resolveSubscriptionExperienceForBucket({
          defaults: defaultSubscriptionExperienceDefaults,
          override: index === 0 ? { trial: { message: { enabled: false } } } : null,
          bucket: definition.value,
          state: definition.value === "pendingReview" ? "pending-review" : definition.value,
          daysRemaining: definition.value === "trial" ? 10 : null,
        }),
        lastUpdatedAt: index === 0 ? "2026-07-18T10:00:00.000Z" : null,
        lastUpdatedBy: index === 0 ? "بدر" : null,
      }),
    );

    const { rerender } = render(
      <CustomerSubscriptionVisibilityCard
        tenantId="tenant-1"
        rows={rows}
        hasAnyOverride
        onAction={vi.fn()}
      />,
    );

    for (const definition of subscriptionExperienceBucketDefinitions) {
      expect(screen.getByText(definition.label)).toBeInTheDocument();
    }
    expect(screen.getByText("الحالة الحالية")).toBeInTheDocument();
    expect(screen.getByText("مخفي")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "مصدر القرار: استثناء خاص بهذا العميل")).toBeInTheDocument();
    expect(screen.getByText((_, element) => Boolean(element?.textContent?.includes("بواسطة بدر")) && element?.tagName === "P")).toBeInTheDocument();
    expect(screen.getAllByText("معاينة الكارت")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "إرجاع جميع الحالات للإعداد العام" })).toBeInTheDocument();

    const inheritedRows = rows.map((row) => ({
      ...row,
      preference: "inherit" as const,
    }));
    rerender(
      <CustomerSubscriptionVisibilityCard
        tenantId="tenant-1"
        rows={inheritedRows}
        hasAnyOverride={false}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("إعداد ظهور العملاء التجريبيون")).toHaveValue("inherit");
    expect(screen.getByRole("button", { name: "إرجاع جميع الحالات للإعداد العام" })).toBeDisabled();
  });
});
