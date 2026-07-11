export const CUSTOMER_ISSUE_STATUSES = ["NEW", "IN_REVIEW", "RESOLVED", "CLOSED"] as const;
export type CustomerIssueStatus = (typeof CUSTOMER_ISSUE_STATUSES)[number];

export const CUSTOMER_ISSUE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type CustomerIssuePriority = (typeof CUSTOMER_ISSUE_PRIORITIES)[number];

export const CUSTOMER_ISSUE_SOURCES = ["CUSTOMER_REPORT", "INTERNAL_AUTO", "ADMIN_REPORT"] as const;
export type CustomerIssueSource = (typeof CUSTOMER_ISSUE_SOURCES)[number];

export type ErrorSourceArea =
  | "MARKETING"
  | "CUSTOMER_DASHBOARD"
  | "ADMIN"
  | "PUBLIC_SITE"
  | "API"
  | "SERVER_ACTION"
  | "GLOBAL";

export type ErrorFingerprintInput = {
  code?: string | null;
  errorType?: string | null;
  route?: string | null;
  stack?: string | null;
  digest?: string | null;
  sourceArea?: ErrorSourceArea | null;
};

export type SourceLocation = {
  file: string;
  line: number;
  column: number;
};

export type JsonPrimitive = string | number | boolean | null;
export type SanitizedIssueValue = JsonPrimitive | SanitizedIssueValue[] | { [key: string]: SanitizedIssueValue };
export type SanitizedIssuePayload = Record<string, SanitizedIssueValue>;
