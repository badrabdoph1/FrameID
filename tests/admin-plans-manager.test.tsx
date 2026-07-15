import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(admin)/admin/plans/actions", () => ({
  archivePlanAction: vi.fn(),
  savePlanAction: vi.fn(),
  togglePlanAction: vi.fn()
}));

import { PlansManagerClient } from "@/app/(admin)/admin/plans/plans-manager-client";

const plans = [
  {
    id: "basic",
    code: "basic",
    name: "الباقة الأساسية",
    priceAmount: 599,
    currency: "EGP",
    billingInterval: "monthly",
    features: { description: "للبداية", featureLines: ["موقع جاهز"] },
    isActive: true,
    sortOrder: 0,
    _count: { subscriptions: 3, paymentRequests: 2 }
  },
  {
    id: "pro",
    code: "professional",
    name: "الباقة الاحترافية",
    priceAmount: 999,
    currency: "EGP",
    billingInterval: "monthly",
    features: { description: "للمحترفين", featureLines: ["دومين خاص"] },
    isActive: false,
    sortOrder: 1,
    _count: { subscriptions: 7, paymentRequests: 4 }
  }
];

const metrics = {
  totalPlans: 2,
  activePlans: 1,
  subscriptionCount: 10,
  paymentCount: 6
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin plans manager", () => {
  it("renders every plan once and opens only one editor on demand", () => {
    const { container } = render(
      <PlansManagerClient plans={plans} metrics={metrics} banner={null} />
    );

    expect(screen.getAllByText("الباقة الأساسية")).toHaveLength(1);
    expect(screen.getAllByText("الباقة الاحترافية")).toHaveLength(1);
    expect(container.querySelectorAll('form input[name="name"]')).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "تعديل الباقة الأساسية" }));

    const editor = screen.getByRole("region", { name: "تعديل الباقة الأساسية" });
    expect(within(editor).getByDisplayValue("الباقة الأساسية")).toBeInTheDocument();
    expect(container.querySelectorAll('form input[name="name"]')).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "تعديل الباقة الاحترافية" }));

    expect(screen.queryByRole("region", { name: "تعديل الباقة الأساسية" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "تعديل الباقة الاحترافية" })).toBeInTheDocument();
    expect(container.querySelectorAll('form input[name="name"]')).toHaveLength(1);
  });

  it("uses one status control and confirms before archiving", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<PlansManagerClient plans={plans} metrics={metrics} banner={null} />);

    expect(screen.getAllByRole("button", { name: /إخفاء الباقة|إظهار الباقة/ })).toHaveLength(2);

    const archiveButton = screen.getByRole("button", { name: "أرشفة الباقة الأساسية" });
    fireEvent.submit(archiveButton.closest("form")!);

    expect(confirm).toHaveBeenCalledWith("سيتم إخفاء الباقة وأرشفتها. هل تريد المتابعة؟");
  });

  it("opens a single empty editor for creating a plan", () => {
    const { container } = render(
      <PlansManagerClient plans={plans} metrics={metrics} banner={null} />
    );

    fireEvent.click(screen.getByRole("button", { name: "إضافة باقة جديدة" }));

    expect(screen.getByRole("region", { name: "إنشاء باقة جديدة" })).toBeInTheDocument();
    expect(container.querySelectorAll('form input[name="name"]')).toHaveLength(1);
  });
});
