import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void }) => React.createElement("a", { href, ...props, onClick: (event: React.MouseEvent) => { event.preventDefault(); onClick?.(); } }, children),
}));

import { CustomerTabBar, normalizeCustomerTab } from "@/app/(admin)/admin/customers/[id]/components/customer-tabs";

describe("customer admin workspace", () => {
  it("uses eight task tabs with reload-safe links", () => {
    render(<CustomerTabBar activeTab="payments" basePath="/admin/customers/customer-1" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(8);
    expect(screen.getByRole("tab", { name: "المدفوعات" })).toHaveAttribute("href", "/admin/customers/customer-1?tab=payments");
    expect(screen.getByRole("tab", { name: "المدفوعات" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: "التدقيق" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "النشاط" })).not.toBeInTheDocument();
  });

  it("changes the visible tab immediately and rejects unknown URL values", () => {
    const onChange = vi.fn();
    render(<CustomerTabBar activeTab="overview" basePath="/admin/customers/customer-1" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "الموقع" }));
    expect(onChange).toHaveBeenCalledWith("website");
    expect(normalizeCustomerTab("unknown")).toBe("overview");
    expect(normalizeCustomerTab("notes")).toBe("notes");
  });
});
