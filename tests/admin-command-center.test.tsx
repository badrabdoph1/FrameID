import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  tenant: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  subscription: { count: vi.fn() },
  site: { count: vi.fn() },
  paymentRequest: {
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  user: { count: vi.fn() },
}));

const issueStatsMock = vi.hoisted(() => vi.fn());

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

describe("admin command center", () => {
  beforeEach(() => {
    prismaMock.tenant.count.mockReset().mockResolvedValue(0);
    prismaMock.tenant.findMany.mockReset().mockResolvedValue([]);
    prismaMock.subscription.count.mockReset().mockResolvedValue(0);
    prismaMock.site.count.mockReset().mockResolvedValue(0);
    prismaMock.paymentRequest.count.mockReset().mockResolvedValue(0);
    prismaMock.paymentRequest.aggregate.mockReset().mockResolvedValue({ _sum: { amount: 0 } });
    issueStatsMock.mockReset().mockResolvedValue({
      total: 0,
      new: 0,
      inReview: 0,
      resolved: 0,
      closed: 0,
      unreportedOccurrences: 0,
    });
  });

  it("shows a calm state instead of inventing urgent work", async () => {
    render(await AdminDashboardPage());

    expect(screen.getByRole("heading", { name: "لوحة القيادة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ما يحتاج تدخلك الآن" })).toBeInTheDocument();
    expect(screen.getByText("لا توجد مهام عاجلة الآن")).toBeInTheDocument();
    expect(screen.queryByText("Customer Lifecycle Command Center")).not.toBeInTheDocument();
  });

  it("sends urgent payments to the filtered review queue", async () => {
    prismaMock.paymentRequest.count.mockResolvedValue(3);

    render(await AdminDashboardPage());

    expect(screen.getByRole("link", { name: /راجع ٣ طلبات دفع معلقة/ })).toHaveAttribute(
      "href",
      "/admin/payments?status=pending",
    );
    for (const link of screen.getAllByRole("link", { name: /طلبات دفع معلقة/ })) {
      expect(link).toHaveAttribute("href", "/admin/payments?status=pending");
    }
  });

  it("explains the empty recent-customer list", async () => {
    render(await AdminDashboardPage());

    expect(screen.getByText("لم ينضم أي عميل بعد")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "عرض كل العملاء" })).toHaveAttribute("href", "/admin/customers");
  });
});
