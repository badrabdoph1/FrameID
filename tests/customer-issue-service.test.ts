import { describe, expect, it } from "vitest";

import { createCustomerIssueService } from "@/modules/customer-issues/customer-issue-service";
import type {
  AttachOccurrenceInput,
  CreateIssueInput,
  CreateOccurrenceRecordInput,
  CustomerIssueRecord,
  CustomerIssueRepository,
  ErrorOccurrenceRecord,
  MergeCandidateInput,
  ResolutionNotificationInput,
  TransitionIssueRecordInput,
} from "@/modules/customer-issues/repository";

class MemoryIssueRepository implements CustomerIssueRepository {
  occurrences: ErrorOccurrenceRecord[] = [];
  issues: CustomerIssueRecord[] = [];
  notifications: ResolutionNotificationInput[] = [];
  events: Array<{ issueId: string; type: string; actorAdminId?: string | null }> = [];

  async createOccurrence(input: CreateOccurrenceRecordInput): Promise<ErrorOccurrenceRecord> {
    const occurrence = { ...input, id: `occ-${this.occurrences.length + 1}` };
    this.occurrences.push(occurrence);
    return occurrence;
  }

  async getOccurrence(id: string): Promise<ErrorOccurrenceRecord | null> {
    return this.occurrences.find((item) => item.id === id) ?? null;
  }

  async getIssue(id: string): Promise<CustomerIssueRecord | null> {
    return this.issues.find((item) => item.id === id) ?? null;
  }

  async findMergeCandidate(input: MergeCandidateInput): Promise<CustomerIssueRecord | null> {
    return this.issues.find((issue) =>
      issue.fingerprint === input.fingerprint
      && issue.userId === input.userId
      && issue.tenantId === input.tenantId
      && issue.siteId === input.siteId
      && issue.status !== "CLOSED"
      && issue.updatedAt >= input.since
    ) ?? null;
  }

  async createIssueWithOccurrence(input: CreateIssueInput): Promise<CustomerIssueRecord> {
    const issue: CustomerIssueRecord = {
      id: `issue-${this.issues.length + 1}`,
      number: this.issues.length + 101,
      status: "NEW",
      priority: input.priority,
      source: input.source,
      title: input.title,
      fingerprint: input.fingerprint,
      customerNote: input.customerNote ?? null,
      resolutionNote: null,
      userId: input.userId,
      tenantId: input.tenantId,
      siteId: input.siteId,
      sessionId: input.sessionId,
      assigneeAdminUserId: null,
      resolvedByAdminUserId: null,
      occurrenceCount: 1,
      lastSeenAt: input.createdAt,
      reviewStartedAt: null,
      resolvedAt: null,
      closedAt: null,
      customerNotifiedAt: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.issues.push(issue);
    const occurrence = await this.getOccurrence(input.occurrenceId);
    if (occurrence) occurrence.issueId = issue.id;
    this.events.push({ issueId: issue.id, type: "CREATED" });
    return issue;
  }

  async attachOccurrence(input: AttachOccurrenceInput): Promise<CustomerIssueRecord> {
    const issue = await this.getIssue(input.issueId);
    if (!issue) throw new Error("missing issue");
    issue.occurrenceCount += 1;
    issue.lastSeenAt = input.seenAt;
    issue.updatedAt = input.seenAt;
    if (!issue.customerNote && input.customerNote) issue.customerNote = input.customerNote;
    const occurrence = await this.getOccurrence(input.occurrenceId);
    if (occurrence) occurrence.issueId = issue.id;
    this.events.push({ issueId: issue.id, type: "OCCURRENCE_ATTACHED" });
    return issue;
  }

  async transitionWithEvent(input: TransitionIssueRecordInput): Promise<CustomerIssueRecord> {
    const issue = await this.getIssue(input.issueId);
    if (!issue) throw new Error("missing issue");
    issue.status = input.toStatus;
    issue.updatedAt = input.changedAt;
    issue.assigneeAdminUserId = input.assigneeAdminUserId ?? issue.assigneeAdminUserId;
    issue.resolvedByAdminUserId = input.resolvedByAdminUserId ?? issue.resolvedByAdminUserId;
    issue.resolutionNote = input.resolutionNote ?? issue.resolutionNote;
    if (input.toStatus === "IN_REVIEW") issue.reviewStartedAt = input.changedAt;
    if (input.toStatus === "RESOLVED") issue.resolvedAt = input.changedAt;
    if (input.toStatus === "CLOSED") issue.closedAt = input.changedAt;
    this.events.push({ issueId: issue.id, type: "STATUS_CHANGED", actorAdminId: input.actorAdminId });
    return issue;
  }

  async createResolutionNotification(input: ResolutionNotificationInput): Promise<void> {
    this.notifications.push(input);
    const issue = await this.getIssue(input.issueId);
    if (issue) issue.customerNotifiedAt = input.sentAt;
    this.events.push({ issueId: input.issueId, type: "CUSTOMER_NOTIFIED", actorAdminId: input.actorAdminId });
  }
}

const NOW = new Date("2026-07-11T15:00:00.000Z");

function occurrenceInput(overrides: Record<string, unknown> = {}) {
  return {
    category: "DB",
    level: "ERROR" as const,
    code: "FID-DB-002",
    errorType: "PrismaError",
    message: "Database failed for record 123",
    route: "/dashboard/sites/site_123",
    stack: "at save (/app/src/modules/sites/save.ts:42:7)",
    sourceArea: "CUSTOMER_DASHBOARD" as const,
    userId: "user-1",
    tenantId: "tenant-1",
    siteId: "site-1",
    sessionId: "session-1",
    metadata: { browser: "Chrome", password: "discard-me" },
    ...overrides,
  };
}

describe("customer issue service", () => {
  it("captures a sanitized occurrence with fingerprint and source location", async () => {
    const repository = new MemoryIssueRepository();
    const service = createCustomerIssueService(repository, { now: () => NOW });

    const occurrence = await service.captureOccurrence(occurrenceInput());

    expect(occurrence.fingerprint).toMatch(/^[a-f0-9]{32}$/);
    expect(occurrence.sourceFile).toBe("src/modules/sites/save.ts");
    expect(occurrence.metadata).toEqual({ browser: "Chrome" });
  });

  it("creates a customer issue from an existing occurrence", async () => {
    const repository = new MemoryIssueRepository();
    const service = createCustomerIssueService(repository, { now: () => NOW });
    const occurrence = await service.captureOccurrence(occurrenceInput());

    const result = await service.reportIssue({ occurrenceId: occurrence.id });

    expect(result.merged).toBe(false);
    expect(result.issue).toMatchObject({ status: "NEW", source: "CUSTOMER_REPORT", priority: "HIGH", occurrenceCount: 1 });
    expect(repository.events).toContainEqual({ issueId: result.issue.id, type: "CREATED" });
  });

  it("merges a repeat report for the same customer and site within 24 hours", async () => {
    const repository = new MemoryIssueRepository();
    const service = createCustomerIssueService(repository, { now: () => NOW });
    const first = await service.captureOccurrence(occurrenceInput());
    const created = await service.reportIssue({ occurrenceId: first.id });
    const second = await service.captureOccurrence(occurrenceInput({ route: "/dashboard/sites/site_999" }));

    const repeated = await service.reportIssue({ occurrenceId: second.id, customerNote: "حصلت تاني" });

    expect(repeated.merged).toBe(true);
    expect(repeated.issue.id).toBe(created.issue.id);
    expect(repeated.issue.occurrenceCount).toBe(2);
    expect(repository.issues).toHaveLength(1);
  });

  it("does not merge reports that belong to different customers", async () => {
    const repository = new MemoryIssueRepository();
    const service = createCustomerIssueService(repository, { now: () => NOW });
    const first = await service.captureOccurrence(occurrenceInput());
    await service.reportIssue({ occurrenceId: first.id });
    const second = await service.captureOccurrence(occurrenceInput({ userId: "user-2", sessionId: "session-2" }));

    await service.reportIssue({ occurrenceId: second.id });

    expect(repository.issues).toHaveLength(2);
  });

  it("tracks review, resolution, and customer notification with the acting admin", async () => {
    const repository = new MemoryIssueRepository();
    const service = createCustomerIssueService(repository, { now: () => NOW });
    const occurrence = await service.captureOccurrence(occurrenceInput());
    const { issue } = await service.reportIssue({ occurrenceId: occurrence.id });

    const reviewing = await service.transitionIssue({ issueId: issue.id, toStatus: "IN_REVIEW", actorAdminId: "admin-1" });
    const resolved = await service.transitionIssue({ issueId: issue.id, toStatus: "RESOLVED", actorAdminId: "admin-1", note: "تم إصلاح الاستعلام" });
    await service.notifyResolved({ issueId: issue.id, actorAdminId: "admin-1" });

    expect(reviewing.assigneeAdminUserId).toBe("admin-1");
    expect(resolved).toMatchObject({ status: "RESOLVED", resolvedByAdminUserId: "admin-1", resolutionNote: "تم إصلاح الاستعلام" });
    expect(repository.notifications[0]).toMatchObject({ tenantId: "tenant-1", actorAdminId: "admin-1" });
  });
});
