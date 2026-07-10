import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  paymentRequest: {
    count: vi.fn().mockResolvedValue(2),
    aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 1500 } }),
    findMany: vi.fn().mockResolvedValue([])
  },
  subscription: {
    groupBy: vi.fn().mockResolvedValue([{ status: "ACTIVE", _count: { _all: 4 } }]),
    findMany: vi.fn().mockResolvedValue([])
  },
  plan: { findMany: vi.fn().mockResolvedValue([]) },
  paymentSettings: { findMany: vi.fn().mockResolvedValue([]) }
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/admin/admin-permission-guards", () => ({
  requireAdminPermission: vi.fn().mockResolvedValue({ id: "admin-1" })
}));
vi.mock("@/components/layout/admin-page-shell", () => ({
  AdminPageShell: ({ children }: { children: React.ReactNode }) => React.createElement("main", null, children)
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href, ...props }, children)
}));

import AdminBillingWorkspacePage from "@/app/(admin)/admin/billing/page";

describe("admin billing workspace", () => {
  it("keeps entity management in dedicated pages", async () => {
    render(await AdminBillingWorkspacePage());

    expect(screen.queryByRole("heading", { name: "الباقات" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "وسائل الدفع" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /إدارة الباقات/ })).toHaveAttribute("href", "/admin/plans");
    expect(screen.getByRole("link", { name: /إعدادات الدفع/ })).toHaveAttribute("href", "/admin/settings/payment");
    expect(prismaMock.plan.findMany).not.toHaveBeenCalled();
    expect(prismaMock.paymentSettings.findMany).not.toHaveBeenCalled();
  });

  it("shows only the daily financial decisions", async () => {
    render(await AdminBillingWorkspacePage());

    expect(screen.getByText("طلبات تحتاج مراجعة")).toBeInTheDocument();
    expect(screen.getByText("اشتراكات قريبة الانتهاء")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /طلبات معلقة/ })).toHaveAttribute(
      "href",
      "/admin/payments?status=pending"
    );
  });
});
