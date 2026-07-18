import { describe, expect, it } from "vitest";

import {
  buildMediaScanReport,
  selectDuplicateCleanupCandidates,
} from "@/modules/media/media-scan-report";

describe("media scan report", () => {
  it("builds actionable scan results from media assets", () => {
    const report = buildMediaScanReport({
      now: new Date("2026-07-18T14:00:00.000Z"),
      localExistingStorageKeys: new Set(["tenant/used.webp"]),
      assets: [
        {
          id: "used",
          url: "/uploads/tenant/used.webp",
          storageKey: "tenant/used.webp",
          kind: "image",
          mimeType: "image/webp",
          sizeBytes: 100,
          width: 100,
          height: 100,
          checksumSha256: "hash-used",
          tenantName: "Ramy",
          references: [{ label: "معرض", count: 1 }],
        },
        {
          id: "unused-a",
          url: "/uploads/tenant/unused-a.webp",
          storageKey: "tenant/unused-a.webp",
          kind: "image",
          mimeType: "image/webp",
          sizeBytes: 200,
          width: 100,
          height: 100,
          checksumSha256: "same",
          tenantName: "Ramy",
          references: [],
        },
        {
          id: "unused-b",
          url: "https://raw.githubusercontent.com/org/repo/main/public/uploads/tenant/unused-b.webp",
          storageKey: "tenant/unused-b.webp",
          kind: "image",
          mimeType: "image/webp",
          sizeBytes: 300,
          width: 100,
          height: 100,
          checksumSha256: "same",
          tenantName: "Ramy",
          references: [],
        },
      ],
    });

    expect(report.summary).toMatchObject({
      totalAssets: 3,
      usedAssets: 1,
      unusedAssets: 2,
      duplicateAssets: 2,
      missingLocalAssets: 1,
      githubAssets: 1,
      localAssets: 2,
      reclaimableBytes: 500,
    });
    expect(report.unusedAssets.map((asset) => asset.id)).toEqual(["unused-a", "unused-b"]);
    expect(report.duplicateGroups).toHaveLength(1);
    expect(report.duplicateGroups[0]).toMatchObject({
      checksumSha256: "same",
      count: 2,
      reclaimableBytes: 200,
    });
    expect(report.missingAssets.map((asset) => asset.id)).toEqual(["unused-a"]);
  });

  it("selects only unused duplicate copies for safe cleanup", () => {
    const report = buildMediaScanReport({
      now: new Date("2026-07-18T14:00:00.000Z"),
      localExistingStorageKeys: new Set(["tenant/used.webp", "tenant/copy-a.webp", "tenant/copy-b.webp"]),
      assets: [
        {
          id: "used-original",
          url: "/uploads/tenant/used.webp",
          storageKey: "tenant/used.webp",
          kind: "image",
          mimeType: "image/webp",
          sizeBytes: 80,
          width: 100,
          height: 100,
          checksumSha256: "duplicate-hash",
          tenantName: "Ramy",
          references: [{ label: "غلاف", count: 1 }],
        },
        {
          id: "unused-copy-a",
          url: "/uploads/tenant/copy-a.webp",
          storageKey: "tenant/copy-a.webp",
          kind: "image",
          mimeType: "image/webp",
          sizeBytes: 250,
          width: 100,
          height: 100,
          checksumSha256: "duplicate-hash",
          tenantName: "Ramy",
          references: [],
        },
        {
          id: "unused-copy-b",
          url: "/uploads/tenant/copy-b.webp",
          storageKey: "tenant/copy-b.webp",
          kind: "image",
          mimeType: "image/webp",
          sizeBytes: 150,
          width: 100,
          height: 100,
          checksumSha256: "duplicate-hash",
          tenantName: "Ramy",
          references: [],
        },
      ],
    });

    expect(selectDuplicateCleanupCandidates(report).map((asset) => asset.id)).toEqual([
      "unused-copy-a",
      "unused-copy-b",
    ]);
  });
});
