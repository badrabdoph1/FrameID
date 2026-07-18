import { describe, expect, it } from "vitest";

import { buildMediaDashboardSummary } from "@/modules/media/media-dashboard-summary";

describe("media dashboard summary", () => {
  it("summarizes lifecycle, usage, duplicate and provider counts", () => {
    const summary = buildMediaDashboardSummary(
      [
        {
          id: "media_1",
          kind: "image",
          sizeBytes: 100,
          checksumSha256: "same",
          lifecycleStatus: "ACTIVE",
          usageStatus: "USED",
          providerId: "github-current",
        },
        {
          id: "media_2",
          kind: "image",
          sizeBytes: 150,
          checksumSha256: "same",
          lifecycleStatus: "ACTIVE",
          usageStatus: "UNUSED",
          providerId: "github-current",
        },
        {
          id: "media_3",
          kind: "image",
          sizeBytes: 200,
          checksumSha256: "unique",
          lifecycleStatus: "IN_TRASH",
          usageStatus: "UNUSED",
          providerId: "backup-full",
          purgeEligibleAt: new Date("2026-07-17T00:00:00.000Z"),
        },
      ],
      {
        now: new Date("2026-07-18T00:00:00.000Z"),
        missingMediaIds: new Set(["media_4"]),
        corruptMediaIds: new Set(["media_5"]),
      },
    );

    expect(summary).toMatchObject({
      totalImages: 3,
      totalSizeBytes: 450,
      usedImages: 1,
      unusedImages: 2,
      duplicateImages: 2,
      corruptImages: 1,
      missingImages: 1,
      githubImages: 2,
      backupImages: 1,
      inTrashImages: 1,
      purgeEligibleImages: 1,
    });
  });
});
