export type OperationStatus =
  | "PENDING"
  | "RUNNING"
  | "PAUSE_REQUESTED"
  | "PAUSED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED";

export type OperationControl = "PAUSE" | "CANCEL";

const CLAIMABLE_IDLE_STATUSES: OperationStatus[] = ["PENDING", "PAUSED"];
const TERMINAL_STATUSES: OperationStatus[] = ["CANCELLED", "SUCCEEDED", "PARTIAL", "FAILED"];

export function canClaimOperation(input: {
  status: OperationStatus;
  leaseExpiresAt?: Date | null;
  now: Date;
}): boolean {
  if (CLAIMABLE_IDLE_STATUSES.includes(input.status)) {
    return true;
  }

  if (input.status !== "RUNNING") {
    return false;
  }

  if (!input.leaseExpiresAt) {
    return true;
  }

  return input.leaseExpiresAt.getTime() <= input.now.getTime();
}

export function computeOperationProgress(input: {
  processedItems: number;
  totalItems: number;
}): number {
  if (input.totalItems <= 0) {
    return 0;
  }

  const progress = input.processedItems / input.totalItems;
  return Math.min(1, Math.max(0, progress));
}

export function requestOperationControl(input: {
  status: OperationStatus;
  control: OperationControl;
}): {
  accepted: boolean;
  status: OperationStatus;
  reason?: "TERMINAL_OPERATION" | "CONTROL_NOT_AVAILABLE";
} {
  if (TERMINAL_STATUSES.includes(input.status)) {
    return {
      accepted: false,
      status: input.status,
      reason: "TERMINAL_OPERATION",
    };
  }

  if (input.status !== "RUNNING" && input.status !== "PENDING") {
    return {
      accepted: false,
      status: input.status,
      reason: "CONTROL_NOT_AVAILABLE",
    };
  }

  return {
    accepted: true,
    status: input.control === "PAUSE" ? "PAUSE_REQUESTED" : "CANCEL_REQUESTED",
  };
}
