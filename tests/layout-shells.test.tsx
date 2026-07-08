import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn() }),
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) =>
    React.createElement("a", { href, ...props }, children),
}));

import { AdminShell } from "@/components/layout/admin-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PhotographerShell } from "@/components/layout/photographer-shell";

describe("application shells", () => {
  it("renders photographer dashboard navigation as a reusable shell", () => {
    render(
      <PhotographerShell>
        <p>Dashboard content</p>
      </PhotographerShell>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "لوحة المصور" })).toBeInTheDocument();
    expect(screen.getByText("تسجيل الخروج")).toBeInTheDocument();
  });

  it("renders super admin navigation as a reusable shell", () => {
    render(
      <AdminShell>
        <p>Admin content</p>
      </AdminShell>
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    const frameIdElements = screen.getAllByText("FrameID");
    expect(frameIdElements.length).toBeGreaterThanOrEqual(1);
    const adminElements = screen.getAllByText("Admin");
    expect(adminElements.length).toBeGreaterThanOrEqual(1);
  });

  it("keeps super admin mobile navigation compact with a full menu", () => {
    render(
      <AdminShell>
        <p>Admin content</p>
      </AdminShell>
    );

    const mobileNav = screen.getByRole("navigation", { name: "تنقل الأدمن للموبايل" });
    expect(within(mobileNav).getAllByRole("link")).toHaveLength(4);
    expect(within(mobileNav).getByRole("button", { name: "فتح كل أقسام الأدمن" })).toBeInTheDocument();
  });

  it("keeps the customer dashboard shell on a dark readable surface", () => {
    const { container } = render(
      <DashboardShell siteSlug="demo">
        <p>Customer dashboard content</p>
      </DashboardShell>
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(screen.getByText("Customer dashboard content")).toBeInTheDocument();
    expect(shell).toHaveStyle({
      background: "#0b0d12",
      color: "#f5ead6",
    });
    expect(screen.getByText("Customer dashboard content").parentElement).toHaveStyle({
      width: "min(100%, 1120px)",
      marginInline: "auto",
    });
  });

  it("keeps customer dashboard mobile navigation compact with a full more menu", () => {
    render(
      <DashboardShell siteSlug="demo">
        <p>Customer dashboard content</p>
      </DashboardShell>
    );

    const mobileNav = screen.getByRole("navigation", { name: "تنقل لوحة العميل للموبايل" });
    expect(within(mobileNav).getAllByRole("link")).toHaveLength(4);
    expect(within(mobileNav).getByRole("button", { name: "فتح باقي أقسام لوحة العميل" })).toBeInTheDocument();

    fireEvent.click(within(mobileNav).getByRole("button", { name: "فتح باقي أقسام لوحة العميل" }));

    const moreMenu = screen.getByRole("dialog", { name: "كل أقسام لوحة العميل" });
    expect(within(moreMenu).getByRole("link", { name: /الفواتير والاشتراك/ })).toBeInTheDocument();
    expect(within(moreMenu).getByRole("link", { name: /الإعدادات/ })).toBeInTheDocument();
  });
});
