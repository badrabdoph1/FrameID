import type { CommunicationWorkItemStatus } from "./types";

const allowedTransitions: Record<CommunicationWorkItemStatus, ReadonlySet<CommunicationWorkItemStatus>> = {
  NEW: new Set(["IN_PROGRESS", "WAITING_CUSTOMER"]),
  IN_PROGRESS: new Set(["WAITING_CUSTOMER", "WAITING_INTERNAL", "RESOLVED"]),
  WAITING_CUSTOMER: new Set(["IN_PROGRESS"]),
  WAITING_INTERNAL: new Set(["IN_PROGRESS"]),
  RESOLVED: new Set(["IN_PROGRESS", "CLOSED"]),
  CLOSED: new Set(["IN_PROGRESS"]),
};

export function assertWorkItemTransition(
  from: CommunicationWorkItemStatus,
  to: CommunicationWorkItemStatus,
): void {
  if (!allowedTransitions[from].has(to)) {
    throw new Error(`انتقال حالة غير مسموح: ${from} -> ${to}`);
  }
}
