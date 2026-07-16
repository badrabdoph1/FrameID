import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void }) => React.createElement("a", { href, ...props, onClick: (event: React.MouseEvent) => { event.preventDefault(); onClick?.(); } }, children),
}));

import { CustomerTabBar, normalizeCustomerTab } from "@/app/(admin)/admin/customers/[id]/components/customer-tabs";

describe("customer admin workspace", () => {
  it("uses four task workspaces with reload-safe links", () => {
    render(<CustomerTabBar activeTab="billing" basePath="/admin/customers/customer-1" onChange={vi.fn()} />);

    const navigation = screen.getByRole("navigation", { name: "أقسام ملف العميل" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
    expect(within(navigation).getByRole("link", { name: "الملخص والإجراءات" })).toHaveAttribute("href", "/admin/customers/customer-1?tab=overview");
    expect(within(navigation).getByRole("link", { name: "الموقع والملفات" })).toHaveAttribute("href", "/admin/customers/customer-1?tab=site");
    expect(within(navigation).getByRole("link", { name: "الاشتراك والمدفوعات" })).toHaveAttribute("href", "/admin/customers/customer-1?tab=billing");
    expect(within(navigation).getByRole("link", { name: "الدعم والحماية" })).toHaveAttribute("href", "/admin/customers/customer-1?tab=support");
    expect(within(navigation).getByRole("link", { name: "الاشتراك والمدفوعات" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByText("البيانات والإجراءات اليومية")).toBeInTheDocument();
    expect(within(navigation).getByText("النشر والوسائط")).toBeInTheDocument();
    expect(within(navigation).getByText("الخطة والسجل المالي")).toBeInTheDocument();
    expect(within(navigation).getByText("الدخول والتواصل")).toBeInTheDocument();
  });

  it("changes the visible workspace and maps every legacy URL value", () => {
    const onChange = vi.fn();
    render(<CustomerTabBar activeTab="overview" basePath="/admin/customers/customer-1" onChange={onChange} />);

    fireEvent.click(screen.getByRole("link", { name: "الموقع والملفات" }));
    expect(onChange).toHaveBeenCalledWith("site");

    expect(normalizeCustomerTab("unknown")).toBe("overview");
    expect(normalizeCustomerTab("website")).toBe("site");
    expect(normalizeCustomerTab("media")).toBe("site");
    expect(normalizeCustomerTab("subscription")).toBe("billing");
    expect(normalizeCustomerTab("payments")).toBe("billing");
    expect(normalizeCustomerTab("sessions")).toBe("support");
    expect(normalizeCustomerTab("notifications")).toBe("support");
    expect(normalizeCustomerTab("notes")).toBe("support");
  });
});
