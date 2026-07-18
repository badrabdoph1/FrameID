import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  addExtraAction: vi.fn(),
  addPackageAction: vi.fn(),
  deleteExtraAction: vi.fn(),
  deletePackageAction: vi.fn(),
  duplicateExtraAction: vi.fn(),
  duplicatePackageAction: vi.fn(),
  reorderExtraAction: vi.fn(),
  reorderPackageAction: vi.fn(),
  updateExtraAction: vi.fn(),
  updatePackageAction: vi.fn(),
}));

vi.mock("@/app/(dashboard)/dashboard/services/actions", () => actions);

import { ServicesClient } from "@/app/(dashboard)/dashboard/services/services-client";

const packages = [
  {
    id: "pkg-1",
    name: "باقة الزفاف",
    subtitle: "تغطية اليوم كامل",
    priceAmount: 15000,
    currency: "EGP",
    features: ["تصوير كامل", "معالجة 250 صورة"],
    isHighlighted: true,
    isActive: true,
    sortOrder: 0,
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe("dashboard services package editor", () => {
  it("submits edited package details after adding and removing feature rows", async () => {
    render(<ServicesClient packages={packages} extras={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "تعديل الباقة وكل النصوص" }));

    const form = screen.getByText("وضع تعديل الباقة: عدّل أي حرف ثم اضغط حفظ.").closest("form")!;
    fireEvent.change(within(form).getByLabelText("عنوان الباقة"), { target: { value: "باقة التصوير الفاخر" } });
    fireEvent.change(within(form).getByLabelText("السعر"), { target: { value: "22000" } });

    const firstFeatureRow = within(form).getByDisplayValue("تصوير كامل").closest("div")!.parentElement!;
    fireEvent.click(within(firstFeatureRow).getByRole("button"));
    fireEvent.click(within(form).getByRole("button", { name: "إضافة خانة" }));

    const featureInputs = within(form).getAllByPlaceholderText(/الميزة/u);
    fireEvent.change(featureInputs[1], { target: { value: "ألبوم مطبوع" } });

    fireEvent.submit(form);

    await waitFor(() => expect(actions.updatePackageAction).toHaveBeenCalledTimes(1));
    const submitted = actions.updatePackageAction.mock.calls[0][0] as FormData;

    expect(submitted.get("id")).toBe("pkg-1");
    expect(submitted.get("name")).toBe("باقة التصوير الفاخر");
    expect(submitted.get("priceAmount")).toBe("22000");
    expect(submitted.getAll("feature")).toEqual(["معالجة 250 صورة", "ألبوم مطبوع"]);
  });
});
