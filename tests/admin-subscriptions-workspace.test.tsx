import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  subscription: {
    groupBy: vi.fn().mockResolvedValue([{ status: "ACTIVE", _count: { _all: 1 } }]),
    findMany: vi.fn().mockResolvedValue([{
      id: "sub-1",
      status: "ACTIVE",
      currentPeriodEnd: new Date("2026-08-01"),
      expiresAt: new Date("2026-08-01"),
      tenant: { id: "tenant-1", displayName: "استوديو النور", owner: { email: "owner@example.com" } },
      plan: { name: "الباقة الأساسية" },
    }]),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/admin/admin-permission-guards", () => ({
  requireAdminPermission: vi.fn().mockResolvedValue({ id: "admin-1" }),
}));
vi.mock("@/components/layout/admin-page-shell", () => ({
  AdminPageShell: ({ children }: { children: React.ReactNode }) => React.createElement("main", null, children),
}));

import AdminSubscriptionsPage from "@/app/(admin)/admin/subscriptions/page";

describe("admin subscriptions workspace", () => {
  it("turns subscription totals into an actionable customer list", async () => {
    render(await AdminSubscriptionsPage({ searchParams: Promise.resolve({ status: "ACTIVE" }) }));

    expect(screen.getByRole("heading", { name: "استوديو النور" })).toBeInTheDocument();
    expect(screen.getByText("الباقة الأساسية")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح العميل" })).toHaveAttribute("href", "/admin/customers/tenant-1?tab=subscription");
    expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "ACTIVE" }),
    }));
  });
});
