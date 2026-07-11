import { createErrorFingerprint, extractSourceLocation } from "./fingerprint";
import type {
  CustomerIssueRecord,
  CustomerIssueRepository,
  ErrorOccurrenceRecord,
  IssueErrorLevel,
} from "./repository";
import { sanitizeIssuePayload, sanitizeIssueUrl } from "./sanitize";
import { assertIssueTransition } from "./state-machine";
import type { CustomerIssueSource, CustomerIssueStatus, ErrorSourceArea } from "./types";

const MERGE_WINDOW_MS = 24 * 60 * 60 * 1_000;

export type CaptureOccurrenceInput = {
  category: string;
  level: IssueErrorLevel;
  code?: string | null;
  errorType?: string | null;
  message: string;
  requestId?: string | null;
  correlationId?: string | null;
  route?: string | null;
  method?: string | null;
  url?: string | null;
  stack?: string | null;
  digest?: string | null;
  cause?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  siteId?: string | null;
  sessionId?: string | null;
  adminUserId?: string | null;
  sourceArea: ErrorSourceArea;
  ipAddress?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  device?: string | null;
  os?: string | null;
  language?: string | null;
  timezone?: string | null;
  screenSize?: string | null;
  referrer?: string | null;
  connectionStatus?: string | null;
  environment?: string | null;
  releaseVersion?: string | null;
  buildVersion?: string | null;
  templateCode?: string | null;
  lastAction?: string | null;
  metadata?: Record<string, unknown>;
};

type ServiceOptions = { now?: () => Date };

function nullable(value?: string | null): string | null {
  return value?.trim() ? value.trim() : null;
}

function priorityFor(level: IssueErrorLevel) {
  if (level === "FATAL") return "CRITICAL" as const;
  if (level === "ERROR") return "HIGH" as const;
  if (level === "WARN") return "MEDIUM" as const;
  return "LOW" as const;
}

function issueTitle(occurrence: ErrorOccurrenceRecord): string {
  const label = occurrence.code || occurrence.errorType || occurrence.category;
  return `${label}: ${occurrence.message}`.slice(0, 180);
}

export function createCustomerIssueService(repository: CustomerIssueRepository, options: ServiceOptions = {}) {
  const now = options.now ?? (() => new Date());

  return {
    async captureOccurrence(input: CaptureOccurrenceInput): Promise<ErrorOccurrenceRecord> {
      const createdAt = now();
      const source = extractSourceLocation(input.stack);
      const fingerprint = createErrorFingerprint(input);

      return repository.createOccurrence({
        category: input.category.slice(0, 80),
        level: input.level,
        code: nullable(input.code),
        errorType: nullable(input.errorType),
        message: input.message.slice(0, 2_000),
        fingerprint,
        requestId: nullable(input.requestId),
        correlationId: nullable(input.correlationId),
        route: nullable(sanitizeIssueUrl(input.route)),
        method: nullable(input.method),
        url: nullable(sanitizeIssueUrl(input.url)),
        stack: nullable(input.stack)?.slice(0, 12_000) ?? null,
        digest: nullable(input.digest),
        cause: nullable(input.cause)?.slice(0, 2_000) ?? null,
        userId: nullable(input.userId),
        tenantId: nullable(input.tenantId),
        siteId: nullable(input.siteId),
        sessionId: nullable(input.sessionId),
        adminUserId: nullable(input.adminUserId),
        sourceArea: input.sourceArea,
        sourceFile: source?.file ?? null,
        sourceLine: source?.line ?? null,
        sourceColumn: source?.column ?? null,
        ipAddress: nullable(input.ipAddress),
        userAgent: nullable(input.userAgent)?.slice(0, 2_000) ?? null,
        browser: nullable(input.browser),
        device: nullable(input.device),
        os: nullable(input.os),
        language: nullable(input.language),
        timezone: nullable(input.timezone),
        screenSize: nullable(input.screenSize),
        referrer: nullable(sanitizeIssueUrl(input.referrer)),
        connectionStatus: nullable(input.connectionStatus),
        environment: nullable(input.environment),
        releaseVersion: nullable(input.releaseVersion),
        buildVersion: nullable(input.buildVersion),
        templateCode: nullable(input.templateCode),
        lastAction: nullable(input.lastAction)?.slice(0, 300) ?? null,
        metadata: sanitizeIssuePayload(input.metadata ?? {}),
        createdAt,
      });
    },

    async reportIssue(input: { occurrenceId: string; customerNote?: string | null; source?: CustomerIssueSource }) {
      const occurrence = await repository.getOccurrence(input.occurrenceId);
      if (!occurrence) throw new Error("سجل المشكلة غير موجود");
      if (occurrence.issueId) {
        const existing = await repository.getIssue(occurrence.issueId);
        if (existing) return { issue: existing, merged: true };
      }

      const reportedAt = now();
      const customerNote = input.customerNote?.trim().slice(0, 2_000) || null;
      const candidate = await repository.findMergeCandidate({
        fingerprint: occurrence.fingerprint,
        userId: occurrence.userId,
        tenantId: occurrence.tenantId,
        siteId: occurrence.siteId,
        since: new Date(reportedAt.getTime() - MERGE_WINDOW_MS),
      });

      if (candidate) {
        const issue = await repository.attachOccurrence({
          issueId: candidate.id,
          occurrenceId: occurrence.id,
          customerNote,
          seenAt: reportedAt,
        });
        return { issue, merged: true };
      }

      const issue = await repository.createIssueWithOccurrence({
        occurrenceId: occurrence.id,
        priority: priorityFor(occurrence.level),
        source: input.source ?? "CUSTOMER_REPORT",
        title: issueTitle(occurrence),
        fingerprint: occurrence.fingerprint,
        customerNote,
        userId: occurrence.userId,
        tenantId: occurrence.tenantId,
        siteId: occurrence.siteId,
        sessionId: occurrence.sessionId,
        createdAt: reportedAt,
      });
      return { issue, merged: false };
    },

    async transitionIssue(input: { issueId: string; toStatus: CustomerIssueStatus; actorAdminId: string; note?: string | null }): Promise<CustomerIssueRecord> {
      const issue = await repository.getIssue(input.issueId);
      if (!issue) throw new Error("البلاغ غير موجود");
      assertIssueTransition(issue.status, input.toStatus);
      const changedAt = now();

      return repository.transitionWithEvent({
        issueId: issue.id,
        fromStatus: issue.status,
        toStatus: input.toStatus,
        actorAdminId: input.actorAdminId,
        assigneeAdminUserId: input.toStatus === "IN_REVIEW" ? input.actorAdminId : undefined,
        resolvedByAdminUserId: input.toStatus === "RESOLVED" ? input.actorAdminId : undefined,
        resolutionNote: input.toStatus === "RESOLVED" ? input.note?.trim().slice(0, 2_000) || null : undefined,
        changedAt,
      });
    },

    async notifyResolved(input: { issueId: string; actorAdminId: string }): Promise<void> {
      const issue = await repository.getIssue(input.issueId);
      if (!issue) throw new Error("البلاغ غير موجود");
      if (!issue.tenantId) throw new Error("البلاغ غير مرتبط بعميل");
      if (issue.status !== "RESOLVED" && issue.status !== "CLOSED") {
        throw new Error("لا يمكن إخطار العميل قبل حل البلاغ");
      }

      await repository.createResolutionNotification({
        issueId: issue.id,
        tenantId: issue.tenantId,
        actorAdminId: input.actorAdminId,
        title: "تم حل المشكلة",
        body: "تم حل المشكلة التي أبلغت عنها، ويمكنك المحاولة مرة أخرى.",
        sentAt: now(),
      });
    },
  };
}
