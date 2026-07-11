import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { createPrismaCustomerIssueRepository } from "@/modules/customer-issues/prisma-customer-issue-repository";
import type { CreateOccurrenceRecordInput } from "@/modules/customer-issues/repository";

const NOW = new Date("2026-07-12T09:00:00.000Z");

function occurrenceInput(): CreateOccurrenceRecordInput {
  return {
    category: "CLIENT_ERROR",
    level: "ERROR",
    code: "FID-CLIENT-001",
    errorType: "TypeError",
    message: "Cannot read property",
    fingerprint: "abc123",
    requestId: "req-1",
    correlationId: "corr-1",
    route: "/dashboard",
    method: "GET",
    url: "https://frameid.app/dashboard",
    stack: "at Page (src/app/page.tsx:10:2)",
    digest: "digest-1",
    cause: null,
    userId: "user-1",
    tenantId: "tenant-1",
    siteId: "site-1",
    sessionId: "session-1",
    adminUserId: null,
    sourceArea: "CUSTOMER_DASHBOARD",
    sourceFile: "src/app/page.tsx",
    sourceLine: 10,
    sourceColumn: 2,
    ipAddress: "127.0.0.1",
    userAgent: "Chrome",
    browser: "Chrome",
    device: "Desktop",
    os: "macOS",
    language: "ar-EG",
    timezone: "Africa/Cairo",
    screenSize: "1440x900",
    referrer: "https://frameid.app/",
    connectionStatus: "online",
    environment: "test",
    releaseVersion: "0.1.0",
    buildVersion: "build-1",
    templateCode: "noir-gold",
    lastAction: "save-site",
    metadata: { viewport: "1280x720" },
    createdAt: NOW,
  };
}

describe("prisma customer issue repository", () => {
  it("persists every technical occurrence without dropping diagnostic fields", async () => {
    let createData: Record<string, unknown> | null = null;
    const prisma = {
      errorLog: {
        async create(args: { data: Record<string, unknown> }) {
          createData = args.data;
          return { id: "occ-1", issueId: null, ...args.data };
        },
      },
    };
    const repository = createPrismaCustomerIssueRepository(prisma as unknown as PrismaClient);

    const occurrence = await repository.createOccurrence(occurrenceInput());

    expect(createData).toMatchObject({
      stack: "at Page (src/app/page.tsx:10:2)",
      tenantId: "tenant-1",
      siteId: "site-1",
      browser: "Chrome",
      lastAction: "save-site",
      metadata: { viewport: "1280x720" },
    });
    expect(occurrence).toMatchObject({ id: "occ-1", fingerprint: "abc123", sourceArea: "CUSTOMER_DASHBOARD" });
  });

  it("creates the issue, event, and occurrence link in one transaction", async () => {
    const calls: string[] = [];
    const issueRow = {
      id: "issue-1",
      number: 101,
      status: "NEW",
      priority: "HIGH",
      source: "CUSTOMER_REPORT",
      title: "FID-CLIENT-001: Cannot read property",
      fingerprint: "abc123",
      customerNote: null,
      resolutionNote: null,
      userId: "user-1",
      tenantId: "tenant-1",
      siteId: "site-1",
      sessionId: "session-1",
      assigneeAdminUserId: null,
      resolvedByAdminUserId: null,
      occurrenceCount: 1,
      lastSeenAt: NOW,
      reviewStartedAt: null,
      resolvedAt: null,
      closedAt: null,
      customerNotifiedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    const tx = {
      customerIssue: {
        async create() {
          calls.push("issue");
          return issueRow;
        },
      },
      customerIssueEvent: {
        async create() {
          calls.push("event");
          return { id: "event-1" };
        },
      },
      errorLog: {
        async update() {
          calls.push("occurrence-link");
          return { id: "occ-1" };
        },
      },
    };
    const prisma = {
      async $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
        calls.push("transaction-start");
        const result = await callback(tx);
        calls.push("transaction-end");
        return result;
      },
    };
    const repository = createPrismaCustomerIssueRepository(prisma as unknown as PrismaClient);

    const issue = await repository.createIssueWithOccurrence({
      occurrenceId: "occ-1",
      priority: "HIGH",
      source: "CUSTOMER_REPORT",
      title: "FID-CLIENT-001: Cannot read property",
      fingerprint: "abc123",
      customerNote: null,
      userId: "user-1",
      tenantId: "tenant-1",
      siteId: "site-1",
      sessionId: "session-1",
      createdAt: NOW,
    });

    expect(issue.id).toBe("issue-1");
    expect(calls).toEqual(["transaction-start", "issue", "event", "occurrence-link", "transaction-end"]);
  });
});
