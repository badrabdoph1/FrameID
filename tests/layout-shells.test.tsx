import React from "react";
import { render, screen } from "@testing-library/react";
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

describe("application shells", () => {
  it("renders photographer dashboard navigation as a reusable shell", () => {
    render(
      <DashboardShell>
        <p>Dashboard content</p>
      </DashboardShell>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "لوحة المصور" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "الإشعارات" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الخروج" })).toBeInTheDocument();
  });

  it("renders super admin navigation as a reusable shell", () => {
    render(
      <AdminShell>
        <p>Admin content</p>
      </AdminShell>
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "لوحة الإدارة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الخروج" })).toBeInTheDocument();
  });
});
