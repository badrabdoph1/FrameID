import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscriptionExperienceOverridesCard } from "@/app/(admin)/admin/messages/subscription-experience-overrides-card";
import { defaultSubscriptionExperienceDefaults } from "@/modules/subscription/subscription-experience";

describe("SubscriptionExperienceOverridesCard", () => {
  it("loads the selected customer's real visibility preference and audit metadata", () => {
    render(
      <SubscriptionExperienceOverridesCard
        defaults={defaultSubscriptionExperienceDefaults}
        trialTenants={[
          {
            id: "tenant-1",
            displayName: "عميل تجريبي",
            status: "TRIAL",
            owner: { name: "أحمد", email: "a@example.com" },
            hasOverride: true,
            override: {
              trial: {
                message: { enabled: false, title: "رسالة خاصة" },
                metadata: {
                  updatedAt: "2026-07-18T10:00:00.000Z",
                  updatedByAdminId: "admin-1",
                  updatedByAdminName: "بدر",
                },
              },
            },
            overrideUpdatedAt: "2026-07-18T10:00:00.000Z",
          },
          {
            id: "tenant-2",
            displayName: "عميل ثانٍ",
            status: "TRIAL",
            owner: { name: "سارة", email: "s@example.com" },
            hasOverride: false,
            override: null,
            overrideUpdatedAt: null,
          },
        ]}
        activeTenants={[]}
        otherTenants={[]}
      />,
    );

    fireEvent.click(screen.getByText("عميل تجريبي"));

    expect(screen.getByLabelText("قرار ظهور الكارت")).toHaveValue("hide");
    expect(screen.getByText((_, element) => element?.tagName === "P" && Boolean(element.textContent?.includes("آخر تعديل بواسطة بدر")))).toBeInTheDocument();

    fireEvent.click(screen.getByText("عميل ثانٍ"));
    expect(screen.getByLabelText("قرار ظهور الكارت")).toHaveValue("inherit");
    expect(screen.getByLabelText("نطاق التطبيق الجماعي")).toHaveValue("visibility");
    expect(screen.getByDisplayValue(defaultSubscriptionExperienceDefaults.trial.message.title)).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent?.includes("المصدر: الإعداد العام") === true)).toBeInTheDocument();
  });
});
