import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/settings/payment",
  useRouter: () => ({ push: vi.fn() }),
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
  }) => React.createElement("a", { href, ...props }, children),
}));

import { AdminShell } from "@/components/layout/admin-shell";

describe("admin shell accessibility", () => {
  it("provides a skip link and a named main content target", () => {
    render(
      <AdminShell>
        <p>محتوى الصفحة</p>
      </AdminShell>,
    );

    expect(
      screen.getByRole("link", { name: "انتقل إلى المحتوى" }),
    ).toHaveAttribute("href", "#admin-main-content");
    expect(screen.getByRole("main")).toHaveAttribute(
      "id",
      "admin-main-content",
    );
  });

  it("uses the central route registry for Arabic breadcrumbs", () => {
    render(
      <AdminShell>
        <p>محتوى الصفحة</p>
      </AdminShell>,
    );

    const breadcrumbs = screen.getByRole("navigation", {
      name: "مسار الصفحة",
    });
    expect(within(breadcrumbs).getByText("لوحة الإدارة")).toBeInTheDocument();
    expect(within(breadcrumbs).getByText("الإعدادات")).toBeInTheDocument();
    expect(within(breadcrumbs).getByText("وسائل الدفع")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not show a fabricated notification count", () => {
    render(
      <AdminShell>
        <p>محتوى الصفحة</p>
      </AdminShell>,
    );

    expect(screen.getAllByRole("link", { name: "الإشعارات" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "3" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("3 إشعارات جديدة")).not.toBeInTheDocument();
  });

  it("keeps four primary mobile destinations and one clear menu action", () => {
    render(
      <AdminShell>
        <p>محتوى الصفحة</p>
      </AdminShell>,
    );

    const mobileNav = screen.getByRole("navigation", {
      name: "التنقل الرئيسي للأدمن على الهاتف",
    });
    expect(within(mobileNav).getAllByRole("link")).toHaveLength(4);
    expect(
      within(mobileNav).getByRole("button", {
        name: "فتح كل أقسام الأدمن",
      }),
    ).toBeInTheDocument();
  });
});
