import type { CustomerIssue, ErrorLog, Prisma, PrismaClient } from "@prisma/client";

import type {
  CustomerIssueRecord,
  CustomerIssueRepository,
  ErrorOccurrenceRecord,
} from "./repository";
import type {
  CustomerIssuePriority,
  CustomerIssueSource,
  CustomerIssueStatus,
  ErrorSourceArea,
  SanitizedIssuePayload,
} from "./types";

function toOccurrence(row: ErrorLog): ErrorOccurrenceRecord {
  return {
    id: row.id,
    issueId: row.issueId,
    category: row.category,
    level: row.level as ErrorOccurrenceRecord["level"],
    code: row.code,
    errorType: row.errorType,
    message: row.message,
    fingerprint: row.fingerprint ?? "",
    requestId: row.requestId,
    correlationId: row.correlationId,
    route: row.route,
    method: row.method,
    url: row.url,
    stack: row.stack,
    digest: row.digest,
    cause: row.cause,
    userId: row.userId,
    tenantId: row.tenantId,
    siteId: row.siteId,
    sessionId: row.sessionId,
    adminUserId: row.adminUserId,
    sourceArea: (row.sourceArea ?? "GLOBAL") as ErrorSourceArea,
    sourceFile: row.sourceFile,
    sourceLine: row.sourceLine,
    sourceColumn: row.sourceColumn,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    browser: row.browser,
    device: row.device,
    os: row.os,
    language: row.language,
    timezone: row.timezone,
    screenSize: row.screenSize,
    referrer: row.referrer,
    connectionStatus: row.connectionStatus,
    environment: row.environment,
    releaseVersion: row.releaseVersion,
    buildVersion: row.buildVersion,
    templateCode: row.templateCode,
    lastAction: row.lastAction,
    metadata: (row.metadata ?? {}) as SanitizedIssuePayload,
    createdAt: row.createdAt,
  };
}

function toIssue(row: CustomerIssue): CustomerIssueRecord {
  return {
    ...row,
    status: row.status as CustomerIssueStatus,
    priority: row.priority as CustomerIssuePriority,
    source: row.source as CustomerIssueSource,
  };
}

function transitionData(input: Parameters<CustomerIssueRepository["transitionWithEvent"]>[0]): Prisma.CustomerIssueUpdateInput {
  const data: Prisma.CustomerIssueUpdateInput = {
    status: input.toStatus,
    assignee: input.assigneeAdminUserId
      ? { connect: { id: input.assigneeAdminUserId } }
      : undefined,
  };

  if (input.toStatus === "IN_REVIEW") {
    data.reviewStartedAt = input.changedAt;
    data.resolvedAt = null;
    data.closedAt = null;
    data.resolvedBy = { disconnect: true };
    data.resolutionNote = null;
  }
  if (input.toStatus === "RESOLVED") {
    data.resolvedAt = input.changedAt;
    data.closedAt = null;
    data.resolutionNote = input.resolutionNote ?? null;
    if (input.resolvedByAdminUserId) {
      data.resolvedBy = { connect: { id: input.resolvedByAdminUserId } };
    }
  }
  if (input.toStatus === "CLOSED") data.closedAt = input.changedAt;

  return data;
}

export function createPrismaCustomerIssueRepository(
  prisma: PrismaClient,
  options: {
    publishResolutionCommunication?: (input: {
      issueId: string;
      tenantId: string;
      title: string;
      body: string;
    }) => Promise<void>;
  } = {},
): CustomerIssueRepository {
  return {
    async createOccurrence(input) {
      const row = await prisma.errorLog.create({
        data: {
          ...input,
          metadata: input.metadata as Prisma.InputJsonObject,
          resolved: input.level === "INFO" || input.level === "DEBUG",
        },
      });
      return toOccurrence(row);
    },

    async getOccurrence(id) {
      const row = await prisma.errorLog.findUnique({ where: { id } });
      return row ? toOccurrence(row) : null;
    },

    async getIssue(id) {
      const row = await prisma.customerIssue.findUnique({ where: { id } });
      return row ? toIssue(row) : null;
    },

    async findMergeCandidate(input) {
      const row = await prisma.customerIssue.findFirst({
        where: {
          fingerprint: input.fingerprint,
          userId: input.userId,
          tenantId: input.tenantId,
          siteId: input.siteId,
          status: { not: "CLOSED" },
          updatedAt: { gte: input.since },
        },
        orderBy: { updatedAt: "desc" },
      });
      return row ? toIssue(row) : null;
    },

    async createIssueWithOccurrence(input) {
      const row = await prisma.$transaction(async (tx) => {
        const issue = await tx.customerIssue.create({
          data: {
            priority: input.priority,
            source: input.source,
            title: input.title,
            fingerprint: input.fingerprint,
            customerNote: input.customerNote,
            userId: input.userId,
            tenantId: input.tenantId,
            siteId: input.siteId,
            sessionId: input.sessionId,
            createdAt: input.createdAt,
            lastSeenAt: input.createdAt,
          },
        });
        await tx.customerIssueEvent.create({
          data: { issueId: issue.id, type: "CREATED", toStatus: "NEW", createdAt: input.createdAt },
        });
        await tx.errorLog.update({ where: { id: input.occurrenceId }, data: { issueId: issue.id } });
        return issue;
      });
      return toIssue(row);
    },

    async attachOccurrence(input) {
      const row = await prisma.$transaction(async (tx) => {
        const issue = await tx.customerIssue.update({
          where: { id: input.issueId },
          data: {
            occurrenceCount: { increment: 1 },
            lastSeenAt: input.seenAt,
            customerNote: input.customerNote ?? undefined,
          },
        });
        await tx.errorLog.update({ where: { id: input.occurrenceId }, data: { issueId: issue.id } });
        await tx.customerIssueEvent.create({
          data: {
            issueId: issue.id,
            type: "OCCURRENCE_ATTACHED",
            note: input.customerNote,
            createdAt: input.seenAt,
          },
        });
        return issue;
      });
      return toIssue(row);
    },

    async transitionWithEvent(input) {
      const row = await prisma.$transaction(async (tx) => {
        const issue = await tx.customerIssue.update({
          where: { id: input.issueId },
          data: transitionData(input),
        });
        await tx.customerIssueEvent.create({
          data: {
            issueId: issue.id,
            actorAdminId: input.actorAdminId,
            type: "STATUS_CHANGED",
            fromStatus: input.fromStatus,
            toStatus: input.toStatus,
            note: input.resolutionNote,
            createdAt: input.changedAt,
          },
        });
        return issue;
      });
      return toIssue(row);
    },

    async createResolutionNotification(input) {
      await prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            tenantId: input.tenantId,
            type: "customer_issue_resolved",
            title: input.title,
            body: input.body,
            priority: "info",
          },
        });
        await tx.customerIssue.update({
          where: { id: input.issueId },
          data: { customerNotifiedAt: input.sentAt },
        });
        await tx.customerIssueEvent.create({
          data: {
            issueId: input.issueId,
            actorAdminId: input.actorAdminId,
            type: "CUSTOMER_NOTIFIED",
            createdAt: input.sentAt,
          },
        });
      });
      await options.publishResolutionCommunication?.({
        issueId: input.issueId,
        tenantId: input.tenantId,
        title: input.title,
        body: input.body,
      }).catch(() => undefined);
    },
  };
}
