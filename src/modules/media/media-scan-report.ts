export type MediaScanReference = {
  label: string;
  count: number;
};

export type MediaScanAssetInput = {
  id: string;
  url: string;
  storageKey: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  checksumSha256: string | null;
  tenantName: string | null;
  references: MediaScanReference[];
};

export type MediaScanAssetFinding = {
  id: string;
  url: string;
  storageKey: string;
  fileName: string;
  tenantName: string | null;
  sizeBytes: number;
  checksumSha256: string | null;
  referenceCount: number;
  used: boolean;
  reasons: string[];
};

export type MediaScanDuplicateGroup = {
  checksumSha256: string;
  count: number;
  reclaimableBytes: number;
  assets: MediaScanAssetFinding[];
};

export type MediaScanReport = {
  generatedAt: string;
  summary: {
    totalAssets: number;
    usedAssets: number;
    unusedAssets: number;
    duplicateAssets: number;
    missingLocalAssets: number;
    githubAssets: number;
    localAssets: number;
    reclaimableBytes: number;
  };
  unusedAssets: MediaScanAssetFinding[];
  duplicateGroups: MediaScanDuplicateGroup[];
  missingAssets: MediaScanAssetFinding[];
  githubAssets: MediaScanAssetFinding[];
  localAssets: MediaScanAssetFinding[];
};

function fileName(storageKey: string) {
  return storageKey.split("/").at(-1) ?? storageKey;
}

function toFinding(asset: MediaScanAssetInput, reasons: string[]): MediaScanAssetFinding {
  const totalReferences = referenceCount(asset);

  return {
    id: asset.id,
    url: asset.url,
    storageKey: asset.storageKey,
    fileName: fileName(asset.storageKey),
    tenantName: asset.tenantName,
    sizeBytes: asset.sizeBytes,
    checksumSha256: asset.checksumSha256,
    referenceCount: totalReferences,
    used: totalReferences > 0,
    reasons,
  };
}

function isGithubAsset(asset: MediaScanAssetInput) {
  return asset.url.includes("raw.githubusercontent.com");
}

function isLocalAsset(asset: MediaScanAssetInput) {
  return !asset.url.startsWith("http");
}

function referenceCount(asset: MediaScanAssetInput) {
  return asset.references.reduce((total, reference) => total + reference.count, 0);
}

export function buildMediaScanReport(input: {
  now: Date;
  assets: MediaScanAssetInput[];
  localExistingStorageKeys: ReadonlySet<string>;
}): MediaScanReport {
  const unusedAssets = input.assets
    .filter((asset) => referenceCount(asset) === 0)
    .map((asset) => toFinding(asset, ["لا توجد مراجع مباشرة مسجلة لهذا الوسيط"]));

  const githubAssets = input.assets
    .filter(isGithubAsset)
    .map((asset) => toFinding(asset, ["موجود عبر GitHub Provider الحالي"]));

  const localAssets = input.assets
    .filter(isLocalAsset)
    .map((asset) => toFinding(asset, ["موجود كرابط محلي داخل public/uploads"]));

  const missingAssets = input.assets
    .filter((asset) => isLocalAsset(asset) && !input.localExistingStorageKeys.has(asset.storageKey))
    .map((asset) => toFinding(asset, ["السجل يشير إلى ملف محلي غير موجود في الجرد الحالي"]));

  const checksumMap = new Map<string, MediaScanAssetInput[]>();
  for (const asset of input.assets) {
    if (!asset.checksumSha256) continue;
    checksumMap.set(asset.checksumSha256, [...(checksumMap.get(asset.checksumSha256) ?? []), asset]);
  }

  const duplicateGroups = [...checksumMap.entries()]
    .filter(([, assets]) => assets.length > 1)
    .map(([checksumSha256, assets]) => {
      const sorted = [...assets].sort((first, second) => {
        const firstUsed = referenceCount(first) > 0 ? 1 : 0;
        const secondUsed = referenceCount(second) > 0 ? 1 : 0;
        return secondUsed - firstUsed || second.sizeBytes - first.sizeBytes;
      });
      const duplicateCandidates = sorted.slice(1).filter((asset) => referenceCount(asset) === 0);
      const reclaimableBytes = duplicateCandidates.reduce((total, asset) => total + asset.sizeBytes, 0);
      return {
        checksumSha256,
        count: assets.length,
        reclaimableBytes,
        assets: sorted.map((asset) => toFinding(asset, ["نفس Hash موجود في أكثر من وسيط"])),
      };
    });

  const duplicateAssets = duplicateGroups.reduce((total, group) => total + group.count, 0);

  return {
    generatedAt: input.now.toISOString(),
    summary: {
      totalAssets: input.assets.length,
      usedAssets: input.assets.length - unusedAssets.length,
      unusedAssets: unusedAssets.length,
      duplicateAssets,
      missingLocalAssets: missingAssets.length,
      githubAssets: githubAssets.length,
      localAssets: localAssets.length,
      reclaimableBytes: unusedAssets.reduce((total, asset) => total + asset.sizeBytes, 0),
    },
    unusedAssets,
    duplicateGroups,
    missingAssets,
    githubAssets,
    localAssets,
  };
}

export function selectDuplicateCleanupCandidates(report: MediaScanReport): MediaScanAssetFinding[] {
  return report.duplicateGroups.flatMap((group) => {
    const sorted = [...group.assets].sort((first, second) => {
      const firstUsed = first.used ? 1 : 0;
      const secondUsed = second.used ? 1 : 0;
      return secondUsed - firstUsed || second.sizeBytes - first.sizeBytes;
    });

    return sorted.slice(1).filter((asset) => !asset.used);
  });
}
