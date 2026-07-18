import {
  computeMediaTrashEligibility,
  type MediaLifecycleStatus,
  type MediaUsageStatus,
} from "@/modules/media/media-lifecycle";

export type MediaDashboardEntry = {
  id: string;
  kind: string;
  sizeBytes?: number | null;
  checksumSha256?: string | null;
  lifecycleStatus: MediaLifecycleStatus;
  usageStatus: MediaUsageStatus;
  providerId?: string | null;
  purgeEligibleAt?: Date | null;
};

export type MediaDashboardSummary = {
  totalImages: number;
  totalSizeBytes: number;
  usedImages: number;
  unusedImages: number;
  duplicateImages: number;
  corruptImages: number;
  missingImages: number;
  githubImages: number;
  backupImages: number;
  inTrashImages: number;
  purgeEligibleImages: number;
};

export function buildMediaDashboardSummary(
  entries: MediaDashboardEntry[],
  context: {
    now: Date;
    corruptMediaIds?: ReadonlySet<string>;
    missingMediaIds?: ReadonlySet<string>;
  },
): MediaDashboardSummary {
  const imageEntries = entries.filter((entry) => entry.kind === "image" || entry.kind.startsWith("image/"));
  const checksumCounts = new Map<string, number>();

  for (const entry of imageEntries) {
    if (!entry.checksumSha256) continue;
    checksumCounts.set(entry.checksumSha256, (checksumCounts.get(entry.checksumSha256) ?? 0) + 1);
  }

  return {
    totalImages: imageEntries.length,
    totalSizeBytes: imageEntries.reduce((total, entry) => total + (entry.sizeBytes ?? 0), 0),
    usedImages: imageEntries.filter((entry) => entry.usageStatus === "USED").length,
    unusedImages: imageEntries.filter((entry) => entry.usageStatus === "UNUSED").length,
    duplicateImages: imageEntries.filter(
      (entry) => entry.checksumSha256 && (checksumCounts.get(entry.checksumSha256) ?? 0) > 1,
    ).length,
    corruptImages: context.corruptMediaIds?.size ?? 0,
    missingImages: context.missingMediaIds?.size ?? 0,
    githubImages: imageEntries.filter((entry) => entry.providerId?.toLowerCase().includes("github")).length,
    backupImages: imageEntries.filter((entry) => entry.providerId?.toLowerCase().includes("backup")).length,
    inTrashImages: imageEntries.filter((entry) => entry.lifecycleStatus === "IN_TRASH").length,
    purgeEligibleImages: imageEntries.filter((entry) =>
      computeMediaTrashEligibility({
        lifecycleStatus: entry.lifecycleStatus,
        usageStatus: entry.usageStatus,
        purgeEligibleAt: entry.purgeEligibleAt,
        now: context.now,
        currentReferenceCount: 0,
      }).eligible,
    ).length,
  };
}
