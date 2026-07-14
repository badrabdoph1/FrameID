import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/admin/admin-permission-guards", () => ({
  requireAdminCenter: vi.fn().mockResolvedValue({ id: "admin-1" }),
}));
vi.mock("@/components/layout/admin-page-shell", () => ({
  AdminPageShell: ({ children }: { children: React.ReactNode }) => React.createElement("main", null, children),
}));

import AdminEmailPage from "@/app/(admin)/admin/email/page";
import { SupportTable } from "@/app/(admin)/admin/support/support-table";

describe("admin communication centers", () => {
  it("keeps support cases tied to the customer context", () => {
    render(<SupportTable data={[{ id: "case-1", subject: "مشكلة دخول", status: "OPEN", tenantName: "استوديو النور", tenantId: "tenant-1", createdAt: "2026-07-14T00:00:00.000Z" }]} />);
    expect(screen.getAllByText("مفتوحة").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "استوديو النور" })[0]).toHaveAttribute("href", "/admin/customers/tenant-1?tab=notes");
  });

  it("describes email readiness honestly without duplicating notification logs", async () => {
    render(await AdminEmailPage());
    expect(screen.getByText("سجل التسليم")).toBeInTheDocument();
    expect(screen.getByText("غير متاح في النظام الحالي")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح سجل التدقيق" })).toHaveAttribute("href", "/admin/audit?q=EMAIL");
  });
});
