export type MediaLifecycleStatus = "ACTIVE" | "IN_TRASH" | "PURGED";

export type MediaUsageStatus = "USED" | "UNUSED" | "UNKNOWN";

export type MediaTrashEligibilityStatus =
  | "NOT_IN_TRASH"
  | "ALREADY_PURGED"
  | "MISSING_PURGE_ELIGIBLE_AT"
  | "UNKNOWN_USAGE"
  | "BLOCKED_BY_CURRENT_USAGE"
  | "WAITING_RETENTION"
  | "ELIGIBLE_FOR_PURGE";

export type MediaTrashEligibilityReason =
  | "MEDIA_NOT_IN_TRASH"
  | "MEDIA_ALREADY_PURGED"
  | "PURGE_DATE_MISSING"
  | "USAGE_UNKNOWN"
  | "CURRENT_USAGE_DETECTED"
  | "RETENTION_NOT_EXPIRED";

export type MediaTrashEligibility = {
  eligible: boolean;
  status: MediaTrashEligibilityStatus;
  daysRemaining: number;
  reasons: MediaTrashEligibilityReason[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_TRASH_RETENTION_DAYS = 30;

export function computePurgeEligibleAt({
  trashedAt,
  retentionDays = DEFAULT_TRASH_RETENTION_DAYS,
}: {
  trashedAt: Date;
  retentionDays?: number;
}): Date {
  return new Date(trashedAt.getTime() + retentionDays * MS_PER_DAY);
}

export function computeMediaTrashEligibility(input: {
  lifecycleStatus: MediaLifecycleStatus;
  usageStatus: MediaUsageStatus;
  purgeEligibleAt?: Date | null;
  now: Date;
  currentReferenceCount?: number;
}): MediaTrashEligibility {
  if (input.lifecycleStatus === "PURGED") {
    return {
      eligible: false,
      status: "ALREADY_PURGED",
      daysRemaining: 0,
      reasons: ["MEDIA_ALREADY_PURGED"],
    };
  }

  if (input.lifecycleStatus !== "IN_TRASH") {
    return {
      eligible: false,
      status: "NOT_IN_TRASH",
      daysRemaining: 0,
      reasons: ["MEDIA_NOT_IN_TRASH"],
    };
  }

  if (!input.purgeEligibleAt) {
    return {
      eligible: false,
      status: "MISSING_PURGE_ELIGIBLE_AT",
      daysRemaining: 0,
      reasons: ["PURGE_DATE_MISSING"],
    };
  }

  if (input.usageStatus === "UNKNOWN") {
    return {
      eligible: false,
      status: "UNKNOWN_USAGE",
      daysRemaining: 0,
      reasons: ["USAGE_UNKNOWN"],
    };
  }

  const currentReferenceCount = input.currentReferenceCount ?? 0;
  const daysRemaining = Math.max(0, Math.ceil((input.purgeEligibleAt.getTime() - input.now.getTime()) / MS_PER_DAY));

  if (input.usageStatus === "USED" || currentReferenceCount > 0) {
    return {
      eligible: false,
      status: "BLOCKED_BY_CURRENT_USAGE",
      daysRemaining,
      reasons: ["CURRENT_USAGE_DETECTED"],
    };
  }

  if (daysRemaining > 0) {
    return {
      eligible: false,
      status: "WAITING_RETENTION",
      daysRemaining,
      reasons: ["RETENTION_NOT_EXPIRED"],
    };
  }

  return {
    eligible: true,
    status: "ELIGIBLE_FOR_PURGE",
    daysRemaining: 0,
    reasons: [],
  };
}

export function reconcileTrashedMediaUsage(input: {
  lifecycleStatus: MediaLifecycleStatus;
  usageStatus: MediaUsageStatus;
  currentReferenceCount: number;
}): {
  lifecycleStatus: MediaLifecycleStatus;
  usageStatus: MediaUsageStatus;
  changed: boolean;
  reason?: "CURRENT_USAGE_DETECTED";
} {
  if (input.lifecycleStatus === "IN_TRASH" && input.currentReferenceCount > 0) {
    return {
      lifecycleStatus: "ACTIVE",
      usageStatus: "USED",
      changed: true,
      reason: "CURRENT_USAGE_DETECTED",
    };
  }

  return {
    lifecycleStatus: input.lifecycleStatus,
    usageStatus: input.usageStatus,
    changed: false,
  };
}
