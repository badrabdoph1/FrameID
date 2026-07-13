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

type PrismaLike = {
  customerIssue: {
    count(args?: unknown): Promise<number>;
    findMany(args: unknown): Promise<Array<Record<string, unknown>>>;
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

export function createCustomerIssueAdminQueries(client: PrismaLike, requireAdmin: RequireAdmin = () => requireAdminCenter("system")) {
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
  };
}

const liveQueries = createCustomerIssueAdminQueries(prisma);

export const getCustomerIssueStats = liveQueries.getCustomerIssueStats;
export const listCustomerIssues = liveQueries.listCustomerIssues;
