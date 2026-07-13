import { render, screen, within } from "@testing-library/react";
import React from "react";
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

import { CustomerIssueCenterView } from "@/app/(admin)/admin/errors/customer-issue-center-view";
import { createCustomerIssueAdminQueries } from "@/modules/customer-issues/admin-queries";

const baseDate = new Date("2026-07-12T10:00:00.000Z");

function issueRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "issue-1",
    number: 42,
    status: "NEW",
    priority: "CRITICAL",
    source: "CUSTOMER_REPORT",
    title: "Dashboard save failed",
    occurrenceCount: 3,
    customerNote: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    lastSeenAt: baseDate,
    assignee: { id: "admin-1", name: "سارة" },
    reporter: { id: "user-1", name: "أحمد علي", email: "ahmed@example.com", phone: "01000000000" },
    tenant: { id: "tenant-1", displayName: "Studio One" },
    site: { id: "site-1", title: "Farah Wedding", slug: "farah" },
    occurrences: [
      {
        id: "occ-1",
        route: "/dashboard/sites/site-1",
        errorType: "TypeError",
        sourceArea: "CUSTOMER_DASHBOARD",
        browser: "Chrome",
        device: "Desktop",
        createdAt: baseDate,
      },
    ],
    ...overrides,
  };
}

describe("customer issue admin center queries", () => {
  it("returns status counters and light list rows without heavy technical payloads", async () => {
    const countCalls: unknown[] = [];
    const findManyCalls: unknown[] = [];
    const prisma = {
      customerIssue: {
        async count(args?: unknown) {
          countCalls.push(args ?? {});
          const status = (args as { where?: { status?: string } } | undefined)?.where?.status;
          return status === "NEW" ? 2 : status === "IN_REVIEW" ? 3 : status === "RESOLVED" ? 5 : status === "CLOSED" ? 7 : 17;
        },
        async findMany(args: unknown) {
          findManyCalls.push(args);
          return [
            issueRow(),
            issueRow({
              id: "issue-2",
              number: 7,
              status: "IN_REVIEW",
              priority: "HIGH",
              reporter: null,
              occurrences: [
                {
                  route: "/p/farah",
                  errorType: "ReferenceError",
                  sourceArea: "PUBLIC_SITE",
                  browser: "Safari",
                  device: "Mobile/Tablet",
                  stack: "private stack must not leak",
                  metadata: { token: "secret" },
                  createdAt: baseDate,
                },
              ],
            }),
          ];
        },
      },
      errorLog: {
        async count() {
          return 4;
        },
      },
    };
    const queries = createCustomerIssueAdminQueries(prisma, async () => ({ id: "admin-1" }));

    await expect(queries.getCustomerIssueStats()).resolves.toEqual({
      total: 17,
      new: 2,
      inReview: 3,
      resolved: 5,
      closed: 7,
      unreportedOccurrences: 4,
    });

    const result = await queries.listCustomerIssues({ search: "farah", status: "NEW", pageSize: 10 });

    expect(countCalls).toHaveLength(6);
    expect(findManyCalls[0]).toMatchObject({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
    });
    expect(result.rows[0]).toMatchObject({
      id: "issue-1",
      number: "ISS-000042",
      status: "NEW",
      priority: "CRITICAL",
      customer: { id: "user-1", name: "أحمد علي", email: "ahmed@example.com" },
      site: { id: "site-1", title: "Farah Wedding", slug: "farah" },
      route: "/dashboard/sites/site-1",
      errorType: "TypeError",
      occurrenceCount: 3,
    });
    expect(JSON.stringify(result.rows)).not.toContain("private stack must not leak");
    expect(JSON.stringify(result.rows)).not.toContain("secret");
  });
});

describe("CustomerIssueCenterView", () => {
  it("renders the customer issue center with badges, metrics, and linked rows", () => {
    render(
      <CustomerIssueCenterView
        stats={{ total: 17, new: 2, inReview: 3, resolved: 5, closed: 7, unreportedOccurrences: 4 }}
        result={{
          rows: [
            {
              id: "issue-1",
              number: "ISS-000042",
              status: "NEW",
              priority: "CRITICAL",
              source: "CUSTOMER_REPORT",
              title: "Dashboard save failed",
              occurrenceCount: 3,
              customer: { id: "user-1", name: "أحمد علي", email: "ahmed@example.com" },
              tenant: { id: "tenant-1", name: "Studio One" },
              site: { id: "site-1", title: "Farah Wedding", slug: "farah" },
              route: "/dashboard/sites/site-1",
              errorType: "TypeError",
              sourceArea: "CUSTOMER_DASHBOARD",
              browser: "Chrome",
              device: "Desktop",
              assigneeName: "سارة",
              createdAt: "2026-07-12T10:00:00.000Z",
              updatedAt: "2026-07-12T10:00:00.000Z",
              lastSeenAt: "2026-07-12T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }}
        filters={{}}
      />,
    );

    expect(screen.getByRole("heading", { name: "مشاكل العملاء" })).toBeInTheDocument();
    expect(screen.getByText("2 بلاغ جديد")).toBeInTheDocument();
    expect(screen.getAllByText("قيد المراجعة").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("محلولة").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("مغلقة").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("4 ظهور تقني بلا بلاغ")).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /ISS-000042/ });
    expect(within(row).getByRole("link", { name: "ISS-000042" })).toHaveAttribute("href", "/admin/errors/issue-1");
    expect(within(row).getByRole("link", { name: "أحمد علي" })).toHaveAttribute("href", "/admin/customers/user-1");
    expect(within(row).getByRole("link", { name: "Farah Wedding" })).toHaveAttribute("href", "/admin/sites/site-1");
    expect(row).toHaveTextContent("TypeError");
    expect(row).not.toHaveTextContent("Stack Trace");
    expect(row).not.toHaveTextContent("metadata");
  });
});
