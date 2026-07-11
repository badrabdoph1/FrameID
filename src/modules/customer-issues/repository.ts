import type {
  CustomerIssuePriority,
  CustomerIssueSource,
  CustomerIssueStatus,
  ErrorSourceArea,
  SanitizedIssuePayload,
} from "./types";

export type IssueErrorLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export type ErrorOccurrenceRecord = {
  id: string;
  issueId?: string | null;
  category: string;
  level: IssueErrorLevel;
  code: string | null;
  errorType: string | null;
  message: string;
  fingerprint: string;
  requestId: string | null;
  correlationId: string | null;
  route: string | null;
  method: string | null;
  url: string | null;
  stack: string | null;
  digest: string | null;
  cause: string | null;
  userId: string | null;
  tenantId: string | null;
  siteId: string | null;
  sessionId: string | null;
  adminUserId: string | null;
  sourceArea: ErrorSourceArea;
  sourceFile: string | null;
  sourceLine: number | null;
  sourceColumn: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  language: string | null;
  timezone: string | null;
  screenSize: string | null;
  referrer: string | null;
  connectionStatus: string | null;
  environment: string | null;
  releaseVersion: string | null;
  buildVersion: string | null;
  templateCode: string | null;
  lastAction: string | null;
  metadata: SanitizedIssuePayload;
  createdAt: Date;
};

export type CreateOccurrenceRecordInput = Omit<ErrorOccurrenceRecord, "id" | "issueId">;

export type CustomerIssueRecord = {
  id: string;
  number: number;
  status: CustomerIssueStatus;
  priority: CustomerIssuePriority;
  source: CustomerIssueSource;
  title: string;
  fingerprint: string;
  customerNote: string | null;
  resolutionNote: string | null;
  userId: string | null;
  tenantId: string | null;
  siteId: string | null;
  sessionId: string | null;
  assigneeAdminUserId: string | null;
  resolvedByAdminUserId: string | null;
  occurrenceCount: number;
  lastSeenAt: Date;
  reviewStartedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  customerNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MergeCandidateInput = {
  fingerprint: string;
  userId: string | null;
  tenantId: string | null;
  siteId: string | null;
  since: Date;
};

export type CreateIssueInput = {
  occurrenceId: string;
  priority: CustomerIssuePriority;
  source: CustomerIssueSource;
  title: string;
  fingerprint: string;
  customerNote?: string | null;
  userId: string | null;
  tenantId: string | null;
  siteId: string | null;
  sessionId: string | null;
  createdAt: Date;
};

export type AttachOccurrenceInput = {
  issueId: string;
  occurrenceId: string;
  customerNote?: string | null;
  seenAt: Date;
};

export type TransitionIssueRecordInput = {
  issueId: string;
  fromStatus: CustomerIssueStatus;
  toStatus: CustomerIssueStatus;
  actorAdminId: string;
  assigneeAdminUserId?: string | null;
  resolvedByAdminUserId?: string | null;
  resolutionNote?: string | null;
  changedAt: Date;
};

export type ResolutionNotificationInput = {
  issueId: string;
  tenantId: string;
  actorAdminId: string;
  title: string;
  body: string;
  sentAt: Date;
};

export interface CustomerIssueRepository {
  createOccurrence(input: CreateOccurrenceRecordInput): Promise<ErrorOccurrenceRecord>;
  getOccurrence(id: string): Promise<ErrorOccurrenceRecord | null>;
  getIssue(id: string): Promise<CustomerIssueRecord | null>;
  findMergeCandidate(input: MergeCandidateInput): Promise<CustomerIssueRecord | null>;
  createIssueWithOccurrence(input: CreateIssueInput): Promise<CustomerIssueRecord>;
  attachOccurrence(input: AttachOccurrenceInput): Promise<CustomerIssueRecord>;
  transitionWithEvent(input: TransitionIssueRecordInput): Promise<CustomerIssueRecord>;
  createResolutionNotification(input: ResolutionNotificationInput): Promise<void>;
}
