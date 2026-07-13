import { prisma } from "@/lib/prisma";
import { requireAdminCenter } from "@/modules/admin/admin-permission-guards";
import type { CustomerIssuePriority, CustomerIssueSource, CustomerIssueStatus } from "./types";

export type CustomerIssueStats = {
  total: number;
  new: number;
  inReview: number;
  resolved: number;
  closed: number;
  unreportedOccurrences: number;
};

export type CustomerIssueListFilters = {
  status?: CustomerIssueStatus | "";
  priority?: CustomerIssuePriority | "";
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CustomerIssueListRow = {
  id: string;
  number: string;
  status: CustomerIssueStatus;
  priority: CustomerIssuePriority;
  source: CustomerIssueSource;
  title: string;
  occurrenceCount: number;
  customer: { id: string; name: string; email: string } | null;
  tenant: { id: string; name: string } | null;
  site: { id: string; title: string; slug: string } | null;
  route: string | null;
  errorType: string | null;
  sourceArea: string | null;
  browser: string | null;
  device: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type CustomerIssueListResult = {
  rows: CustomerIssueListRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type CustomerIssueDetailOccurrence = {
  id: string;
  code: string | null;
  errorType: string | null;
  message: string;
  route: string | null;
  url: string | null;
  method: string | null;
  stack: string | null;
  digest: string | null;
  requestId: string | null;
  correlationId: string | null;
  sourceArea: string | null;
  sourceFile: string | null;
  sourceLine: number | null;
  sourceColumn: number | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  environment: string | null;
  buildVersion: string | null;
  releaseVersion: string | null;
  templateCode: string | null;
  lastAction: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type CustomerIssueDetail = {
  id: string;
  number: string;
  status: CustomerIssueStatus;
  priority: CustomerIssuePriority;
  source: CustomerIssueSource;
  title: string;
  fingerprint: string;
  customerNote: string | null;
  resolutionNote: string | null;
  occurrenceCount: number;
  sessionId: string | null;
  customer: { id: string; name: string; email: string; phone: string | null } | null;
  tenant: { id: string; name: string } | null;
  site: { id: string; title: string; slug: string; templateCode: string | null } | null;
  assigneeName: string | null;
  resolvedByName: string | null;
  latestOccurrence: CustomerIssueDetailOccurrence | null;
  occurrences: CustomerIssueDetailOccurrence[];
  events: Array<{ id: string; type: string; fromStatus: string | null; toStatus: string | null; note: string | null; actorName: string | null; createdAt: string }>;
  reviewStartedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  customerNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

type PrismaLike = {
  customerIssue: {
    count(args?: unknown): Promise<number>;
    findMany(args: unknown): Promise<Array<Record<string, unknown>>>;
    findUnique?(args: unknown): Promise<Record<string, unknown> | null>;
  };
  errorLog: {
    count(args?: unknown): Promise<number>;
  };
};

type RequireAdmin = () => Promise<unknown>;

function issueNumber(number: number): string {
  return `ISS-${number.toString().padStart(6, "0")}`;
}

function parseIssueNumber(search: string): number | null {
  const trimmed = search.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(?:ISS-?)?0*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function dateString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function buildWhere(filters: CustomerIssueListFilters) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;

  const search = filters.search?.trim();
  if (search) {
    const number = parseIssueNumber(search);
    where.OR = [
      ...(number ? [{ number }] : []),
      { title: { contains: search, mode: "insensitive" } },
      { reporter: { is: { name: { contains: search, mode: "insensitive" } } } },
      { reporter: { is: { email: { contains: search, mode: "insensitive" } } } },
      { tenant: { is: { displayName: { contains: search, mode: "insensitive" } } } },
      { site: { is: { title: { contains: search, mode: "insensitive" } } } },
      { site: { is: { slug: { contains: search, mode: "insensitive" } } } },
      { occurrences: { some: { route: { contains: search, mode: "insensitive" } } } },
      { occurrences: { some: { errorType: { contains: search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

const listSelect = {
  id: true,
  number: true,
  status: true,
  priority: true,
  source: true,
  title: true,
  occurrenceCount: true,
  createdAt: true,
  updatedAt: true,
  lastSeenAt: true,
  reporter: { select: { id: true, name: true, email: true } },
  tenant: { select: { id: true, displayName: true } },
  site: { select: { id: true, title: true, slug: true } },
  assignee: { select: { id: true, name: true } },
  occurrences: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      route: true,
      errorType: true,
      sourceArea: true,
      browser: true,
      device: true,
      createdAt: true,
    },
  },
} as const;

const detailSelect = {
  id: true,
  number: true,
  status: true,
  priority: true,
  source: true,
  title: true,
  fingerprint: true,
  customerNote: true,
  resolutionNote: true,
  occurrenceCount: true,
  sessionId: true,
  reviewStartedAt: true,
  resolvedAt: true,
  closedAt: true,
  customerNotifiedAt: true,
  createdAt: true,
  updatedAt: true,
  lastSeenAt: true,
  reporter: { select: { id: true, name: true, email: true, phone: true } },
  tenant: { select: { id: true, displayName: true } },
  site: { select: { id: true, title: true, slug: true, templateCode: true } },
  assignee: { select: { id: true, name: true } },
  resolvedBy: { select: { id: true, name: true } },
  occurrences: { orderBy: { createdAt: "desc" } },
  events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
} as const;

function serializeIssue(row: Record<string, unknown>): CustomerIssueListRow {
  const reporter = row.reporter as { id: string; name: string; email: string } | null | undefined;
  const tenant = row.tenant as { id: string; displayName: string } | null | undefined;
  const site = row.site as { id: string; title: string; slug: string } | null | undefined;
  const assignee = row.assignee as { name: string } | null | undefined;
  const occurrence = ((row.occurrences as Array<Record<string, unknown>> | undefined) ?? [])[0];

  return {
    id: String(row.id),
    number: issueNumber(Number(row.number)),
    status: row.status as CustomerIssueStatus,
    priority: row.priority as CustomerIssuePriority,
    source: row.source as CustomerIssueSource,
    title: String(row.title),
    occurrenceCount: Number(row.occurrenceCount ?? 0),
    customer: reporter ? { id: reporter.id, name: reporter.name, email: reporter.email } : null,
    tenant: tenant ? { id: tenant.id, name: tenant.displayName } : null,
    site: site ? { id: site.id, title: site.title, slug: site.slug } : null,
    route: occurrence?.route ? String(occurrence.route) : null,
    errorType: occurrence?.errorType ? String(occurrence.errorType) : null,
    sourceArea: occurrence?.sourceArea ? String(occurrence.sourceArea) : null,
    browser: occurrence?.browser ? String(occurrence.browser) : null,
    device: occurrence?.device ? String(occurrence.device) : null,
    assigneeName: assignee?.name ?? null,
    createdAt: dateString(row.createdAt),
    updatedAt: dateString(row.updatedAt),
    lastSeenAt: dateString(row.lastSeenAt),
  };
}

function nullableDate(value: unknown): string | null {
  return value ? dateString(value) : null;
}

function serializeOccurrence(row: Record<string, unknown>): CustomerIssueDetailOccurrence {
  return {
    id: String(row.id),
    code: row.code ? String(row.code) : null,
    errorType: row.errorType ? String(row.errorType) : null,
    message: String(row.message ?? ""),
    route: row.route ? String(row.route) : null,
    url: row.url ? String(row.url) : null,
    method: row.method ? String(row.method) : null,
    stack: row.stack ? String(row.stack) : null,
    digest: row.digest ? String(row.digest) : null,
    requestId: row.requestId ? String(row.requestId) : null,
    correlationId: row.correlationId ? String(row.correlationId) : null,
    sourceArea: row.sourceArea ? String(row.sourceArea) : null,
    sourceFile: row.sourceFile ? String(row.sourceFile) : null,
    sourceLine: typeof row.sourceLine === "number" ? row.sourceLine : null,
    sourceColumn: typeof row.sourceColumn === "number" ? row.sourceColumn : null,
    browser: row.browser ? String(row.browser) : null,
    device: row.device ? String(row.device) : null,
    os: row.os ? String(row.os) : null,
    environment: row.environment ? String(row.environment) : null,
    buildVersion: row.buildVersion ? String(row.buildVersion) : null,
    releaseVersion: row.releaseVersion ? String(row.releaseVersion) : null,
    templateCode: row.templateCode ? String(row.templateCode) : null,
    lastAction: row.lastAction ? String(row.lastAction) : null,
    metadata: (row.metadata as Record<string, unknown> | null | undefined) ?? null,
    createdAt: dateString(row.createdAt),
  };
}

function serializeDetail(row: Record<string, unknown>): CustomerIssueDetail {
  const reporter = row.reporter as { id: string; name: string; email: string; phone?: string | null } | null | undefined;
  const tenant = row.tenant as { id: string; displayName: string } | null | undefined;
  const site = row.site as { id: string; title: string; slug: string; templateCode?: string | null } | null | undefined;
  const assignee = row.assignee as { name: string } | null | undefined;
  const resolvedBy = row.resolvedBy as { name: string } | null | undefined;
  const occurrences = ((row.occurrences as Array<Record<string, unknown>> | undefined) ?? []).map(serializeOccurrence);
  const events = ((row.events as Array<Record<string, unknown>> | undefined) ?? []).map((event) => ({
    id: String(event.id),
    type: String(event.type),
    fromStatus: event.fromStatus ? String(event.fromStatus) : null,
    toStatus: event.toStatus ? String(event.toStatus) : null,
    note: event.note ? String(event.note) : null,
    actorName: ((event.actor as { name?: string } | null | undefined)?.name) ?? null,
    createdAt: dateString(event.createdAt),
  }));

  return {
    id: String(row.id),
    number: issueNumber(Number(row.number)),
    status: row.status as CustomerIssueStatus,
    priority: row.priority as CustomerIssuePriority,
    source: row.source as CustomerIssueSource,
    title: String(row.title),
    fingerprint: String(row.fingerprint),
    customerNote: row.customerNote ? String(row.customerNote) : null,
    resolutionNote: row.resolutionNote ? String(row.resolutionNote) : null,
    occurrenceCount: Number(row.occurrenceCount ?? occurrences.length),
    sessionId: row.sessionId ? String(row.sessionId) : null,
    customer: reporter ? { id: reporter.id, name: reporter.name, email: reporter.email, phone: reporter.phone ?? null } : null,
    tenant: tenant ? { id: tenant.id, name: tenant.displayName } : null,
    site: site ? { id: site.id, title: site.title, slug: site.slug, templateCode: site.templateCode ?? null } : null,
    assigneeName: assignee?.name ?? null,
    resolvedByName: resolvedBy?.name ?? null,
    latestOccurrence: occurrences[0] ?? null,
    occurrences,
    events,
    reviewStartedAt: nullableDate(row.reviewStartedAt),
    resolvedAt: nullableDate(row.resolvedAt),
    closedAt: nullableDate(row.closedAt),
    customerNotifiedAt: nullableDate(row.customerNotifiedAt),
    createdAt: dateString(row.createdAt),
    updatedAt: dateString(row.updatedAt),
    lastSeenAt: dateString(row.lastSeenAt),
  };
}

export function createCustomerIssueAdminQueries(client: PrismaLike, requireAdmin: RequireAdmin = () => requireAdminCenter("support")) {
  return {
    async getCustomerIssueStats(): Promise<CustomerIssueStats> {
      await requireAdmin();
      const [total, newCount, inReview, resolved, closed, unreportedOccurrences] = await Promise.all([
        client.customerIssue.count(),
        client.customerIssue.count({ where: { status: "NEW" } }),
        client.customerIssue.count({ where: { status: "IN_REVIEW" } }),
        client.customerIssue.count({ where: { status: "RESOLVED" } }),
        client.customerIssue.count({ where: { status: "CLOSED" } }),
        client.errorLog.count({ where: { issueId: null, resolved: false } }),
      ]);

      return { total, new: newCount, inReview, resolved, closed, unreportedOccurrences };
    },

    async listCustomerIssues(filters: CustomerIssueListFilters = {}): Promise<CustomerIssueListResult> {
      await requireAdmin();
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), 100);
      const where = buildWhere(filters);
      const [rows, total] = await Promise.all([
        client.customerIssue.findMany({
          where,
          select: listSelect,
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        client.customerIssue.count({ where }),
      ]);

      return { rows: rows.map(serializeIssue), total, page, pageSize };
    },

    async getCustomerIssueDetail(id: string): Promise<CustomerIssueDetail | null> {
      await requireAdmin();
      if (!client.customerIssue.findUnique) throw new Error("Customer issue detail query is unavailable");
      const row = await client.customerIssue.findUnique({
        where: { id },
        select: detailSelect,
      });
      return row ? serializeDetail(row) : null;
    },
  };
}

const liveQueries = createCustomerIssueAdminQueries(prisma);

export const getCustomerIssueStats = liveQueries.getCustomerIssueStats;
export const listCustomerIssues = liveQueries.listCustomerIssues;
export const getCustomerIssueDetail = liveQueries.getCustomerIssueDetail;
