import { render, screen } from "@testing-library/react";
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

import { CustomerIssueDetailView } from "@/app/(admin)/admin/errors/[id]/customer-issue-detail-view";
import { createCustomerIssueAdminWorkflow } from "@/modules/customer-issues/admin-actions";
import { createCustomerIssueAdminQueries } from "@/modules/customer-issues/admin-queries";

const now = new Date("2026-07-12T10:00:00.000Z");

function rawDetail() {
  return {
    id: "issue-1",
    number: 42,
    status: "IN_REVIEW",
    priority: "CRITICAL",
    source: "CUSTOMER_REPORT",
    title: "TypeError: Save failed",
    fingerprint: "fp-1",
    customerNote: "ظهرت بعد الضغط على حفظ",
    resolutionNote: null,
    userId: "user-1",
    tenantId: "tenant-1",
    siteId: "site-1",
    sessionId: "session-1",
    assigneeAdminUserId: "admin-1",
    resolvedByAdminUserId: null,
    occurrenceCount: 2,
    lastSeenAt: now,
    reviewStartedAt: now,
    resolvedAt: null,
    closedAt: null,
    customerNotifiedAt: null,
    createdAt: now,
    updatedAt: now,
    reporter: { id: "user-1", name: "أحمد علي", email: "ahmed@example.com", phone: "01000000000" },
    tenant: { id: "tenant-1", displayName: "Studio One" },
    site: { id: "site-1", title: "Farah Wedding", slug: "farah", templateCode: "noir-gold" },
    assignee: { id: "admin-1", name: "سارة" },
    resolvedBy: null,
    occurrences: [
      {
        id: "occ-1",
        code: "FID-CLIENT-001",
        errorType: "TypeError",
        message: "Save failed",
        route: "/dashboard/sites/site-1",
        url: "https://frameid.app/dashboard/sites/site-1",
        method: "POST",
        stack: "at saveSite (src/app/actions.ts:12:4)",
        digest: "digest-1",
        requestId: "req-1",
        correlationId: "corr-1",
        sourceArea: "CUSTOMER_DASHBOARD",
        sourceFile: "src/app/actions.ts",
        sourceLine: 12,
        sourceColumn: 4,
        browser: "Chrome",
        device: "Desktop",
        os: "macOS",
        environment: "production",
        buildVersion: "build-1",
        releaseVersion: "0.1.0",
        templateCode: "noir-gold",
        lastAction: "save-site",
        metadata: { viewport: "1440x900", token: "[Filtered]" },
        createdAt: now,
      },
    ],
    events: [
      { id: "event-1", type: "CREATED", fromStatus: null, toStatus: "NEW", note: null, createdAt: now, actor: null },
      { id: "event-2", type: "STATUS_CHANGED", fromStatus: "NEW", toStatus: "IN_REVIEW", note: null, createdAt: now, actor: { name: "سارة" } },
    ],
  };
}

describe("customer issue detail queries", () => {
  it("loads the complete technical detail for an admin-only issue page", async () => {
    const prisma = {
      customerIssue: {
        async count() {
          return 0;
        },
        async findMany() {
          return [];
        },
        async findUnique(args: unknown) {
          expect(args).toMatchObject({ where: { id: "issue-1" } });
          return rawDetail();
        },
      },
      errorLog: { async count() { return 0; } },
    };
    const queries = createCustomerIssueAdminQueries(prisma, async () => ({ id: "admin-1" }));

    const detail = await queries.getCustomerIssueDetail("issue-1");

    expect(detail).toMatchObject({
      id: "issue-1",
      number: "ISS-000042",
      customer: { id: "user-1", name: "أحمد علي", email: "ahmed@example.com", phone: "01000000000" },
      site: { id: "site-1", title: "Farah Wedding", slug: "farah", templateCode: "noir-gold" },
      assigneeName: "سارة",
      latestOccurrence: {
        stack: "at saveSite (src/app/actions.ts:12:4)",
        metadata: { viewport: "1440x900", token: "[Filtered]" },
        sourceFile: "src/app/actions.ts",
      },
    });
  });
});

describe("CustomerIssueDetailView", () => {
  it("renders the requested fields and admin actions", async () => {
    const queries = createCustomerIssueAdminQueries(
      {
        customerIssue: {
          async count() { return 0; },
          async findMany() { return []; },
          async findUnique() { return rawDetail(); },
        },
        errorLog: { async count() { return 0; } },
      },
      async () => ({ id: "admin-1" }),
    );
    const detail = await queries.getCustomerIssueDetail("issue-1");
    if (!detail) throw new Error("missing detail");

    render(<CustomerIssueDetailView issue={detail} />);

    expect(screen.getByRole("heading", { name: /ISS-000042/ })).toBeInTheDocument();
    expect(screen.getByText("قيد المراجعة")).toBeInTheDocument();
    expect(screen.getByText("حرجة")).toBeInTheDocument();
    expect(screen.getByText("أحمد علي")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح العميل" })).toHaveAttribute("href", "/admin/customers/user-1");
    expect(screen.getByRole("link", { name: "فتح الموقع" })).toHaveAttribute("href", "/admin/sites/site-1");
    expect(screen.getByText("/dashboard/sites/site-1")).toBeInTheDocument();
    expect(screen.getByText("src/app/actions.ts:12:4")).toBeInTheDocument();
    expect(screen.getByText(/at saveSite/)).toBeInTheDocument();
    expect(screen.getByText(/viewport/)).toBeInTheDocument();
    expect(screen.getByText("Chrome / Desktop / macOS")).toBeInTheDocument();
    expect(screen.getByText("production · build-1 · 0.1.0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "بدء المراجعة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تعليم كمحلول" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة فتح" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نسخ جميع التفاصيل" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح سجل الأخطاء" })).toHaveAttribute("href", "#occurrences");
    expect(screen.getByRole("link", { name: "فتح الملف البرمجي" })).toHaveAttribute("href", "/admin/code?file=src%2Fapp%2Factions.ts&line=12");
  });
});

describe("customer issue admin workflow", () => {
  it("runs status transitions, customer notification, and revalidation with admin attribution", async () => {
    const calls: unknown[] = [];
    const workflow = createCustomerIssueAdminWorkflow({
      getAdmin: async () => ({ id: "admin-1" }),
      service: {
        async transitionIssue(input: unknown) {
          calls.push(["transition", input]);
          return { id: "issue-1" };
        },
        async notifyResolved(input: unknown) {
          calls.push(["notify", input]);
        },
      },
      revalidate: (path: string) => calls.push(["revalidate", path]),
    });

    await workflow.startReview("issue-1");
    await workflow.resolveIssue("issue-1", "تم إصلاح السبب");
    await workflow.reopenIssue("issue-1");
    await workflow.closeIssue("issue-1");
    await workflow.notifyCustomerResolved("issue-1");

    expect(calls).toContainEqual(["transition", { issueId: "issue-1", toStatus: "IN_REVIEW", actorAdminId: "admin-1" }]);
    expect(calls).toContainEqual(["transition", { issueId: "issue-1", toStatus: "RESOLVED", actorAdminId: "admin-1", note: "تم إصلاح السبب" }]);
    expect(calls).toContainEqual(["transition", { issueId: "issue-1", toStatus: "CLOSED", actorAdminId: "admin-1" }]);
    expect(calls).toContainEqual(["notify", { issueId: "issue-1", actorAdminId: "admin-1" }]);
    expect(calls).toContainEqual(["revalidate", "/admin/errors"]);
    expect(calls).toContainEqual(["revalidate", "/admin/errors/issue-1"]);
    expect(calls).toContainEqual(["revalidate", "/admin"]);
  });
});
