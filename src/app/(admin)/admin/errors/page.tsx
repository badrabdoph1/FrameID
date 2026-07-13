import { CustomerIssueCenterView } from "./customer-issue-center-view";
import {
  getCustomerIssueStats,
  listCustomerIssues,
  type CustomerIssueListFilters,
} from "@/modules/customer-issues/admin-queries";
import type { CustomerIssuePriority, CustomerIssueStatus } from "@/modules/customer-issues/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const statusValues = new Set<CustomerIssueStatus>(["NEW", "IN_REVIEW", "RESOLVED", "CLOSED"]);
const priorityValues = new Set<CustomerIssuePriority>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function filtersFromParams(params: Record<string, string | string[] | undefined>): CustomerIssueListFilters {
  const status = single(params.status) as CustomerIssueStatus | undefined;
  const priority = single(params.priority) as CustomerIssuePriority | undefined;
  const page = Number(single(params.page) ?? 1);
  return {
    search: single(params.q),
    status: status && statusValues.has(status) ? status : undefined,
    priority: priority && priorityValues.has(priority) ? priority : undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 20,
  };
}

export default async function AdminCustomerIssueCenterPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const filters = filtersFromParams(params);
  const [stats, result] = await Promise.all([
    getCustomerIssueStats(),
    listCustomerIssues(filters),
  ]);

  return <CustomerIssueCenterView stats={stats} result={result} filters={filters} />;
}
