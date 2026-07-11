import type { CustomerIssueStatus } from "./types";

const TRANSITIONS: Record<CustomerIssueStatus, readonly CustomerIssueStatus[]> = {
  NEW: ["IN_REVIEW"],
  IN_REVIEW: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_REVIEW"],
  CLOSED: ["IN_REVIEW"],
};

export function canTransitionIssue(from: CustomerIssueStatus, to: CustomerIssueStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertIssueTransition(from: CustomerIssueStatus, to: CustomerIssueStatus): void {
  if (!canTransitionIssue(from, to)) {
    throw new Error(`انتقال حالة البلاغ غير مسموح: ${from} -> ${to}`);
  }
}
