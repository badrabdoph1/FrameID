import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  tenant: {
    count: vi.fn().mockResolvedValue(10),
    findMany: vi.fn().mockResolvedValue([]),
  },
  subscription: { count: vi.fn().mockResolvedValue(1) },
  paymentRequest: {
    count: vi.fn().mockResolvedValue(2),
    aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 4500 } }),
  },
}));

const issueStatsMock = vi.hoisted(() => vi.fn().mockResolvedValue({
  total: 9,
  new: 2,
  inReview: 3,
  resolved: 4,
  closed: 0,
  unreportedOccurrences: 1,
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/admin/admin-page-guards", () => ({
  requireSuperAdminSession: vi.fn().mockResolvedValue({ user: { id: "admin-1", name: "سارة" } }),
}));
vi.mock("@/modules/customer-issues/admin-queries", () => ({
  getCustomerIssueStats: issueStatsMock,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

import AdminDashboardPage from "@/app/(admin)/admin/page";
import { adminSections } from "@/modules/admin/navigation";

describe("admin customer issue navigation", () => {
  it("promotes customer issues in the admin navigation", () => {
    const links = adminSections.flatMap((section) => section.links);
    const issueLink = links.find((link) => link.href === "/admin/errors");

    expect(issueLink).toMatchObject({ label: "مشاكل العملاء", href: "/admin/errors" });
  });

  it("shows customer issue counts on the admin homepage", async () => {
    render(await AdminDashboardPage());

    expect(await screen.findByRole("link", { name: /مشاكل العملاء/ })).toHaveAttribute("href", "/admin/errors");
    expect(screen.getByText("2 بلاغ جديد")).toBeInTheDocument();
    expect(screen.getByText("3 قيد المراجعة")).toBeInTheDocument();
    expect(screen.getByText("4 محلولة")).toBeInTheDocument();
    expect(issueStatsMock).toHaveBeenCalled();
  });
});
