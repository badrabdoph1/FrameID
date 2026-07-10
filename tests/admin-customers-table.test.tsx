import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import {
  CustomersTable,
  type CustomerRow,
} from "@/app/(admin)/admin/customers/customers-table";

const customers: CustomerRow[] = [
  {
    id: "customer-1",
    displayName: "Ali Studio",
    ownerName: "Ali Hassan",
    ownerEmail: "ali@example.com",
    status: "TRIAL",
    trialEndsAt: "2026-07-18T00:00:00.000Z",
    lifecycleEndAt: null,
    subscriptionStatus: "TRIAL",
    planName: null,
    latestPaymentStatus: null,
    isPublished: true,
    sitesCount: 2,
    paymentsCount: 1,
    createdAt: "2026-07-08T00:00:00.000Z",
  },
];

describe("customers admin table", () => {
  it("renders customers as readable mobile cards before the desktop table", () => {
    render(
      <CustomersTable
        data={customers}
        page={1}
        totalPages={1}
        basePath="/admin/customers"
        search=""
        statusFilter=""
        lifecycleFilter=""
      />
    );

    const mobileList = screen.getByRole("list", { name: "قائمة العملاء للموبايل" });
    expect(mobileList).toHaveClass("md:hidden");

    const card = within(mobileList).getByRole("listitem", { name: "Ali Studio" });
    expect(within(card).getByText("Ali Hassan")).toBeInTheDocument();
    expect(within(card).getByText("ali@example.com")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /فتح ملف العميل/ })).toHaveAttribute(
      "href",
      "/admin/customers/customer-1",
    );
  });
});
