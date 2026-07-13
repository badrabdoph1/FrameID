import { join } from "node:path";

import { getGitHubBackupBranch } from "./backup-job-service";
import { createSha256Checksum, validateBackupManifest, type BackupManifest, type BackupType } from "./backup-manifest";

type CatalogSourceEntry = { backupId: string; commitSha: string | null; manifest: BackupManifest };
type CatalogSource = { listBackupManifests(branch: string): Promise<CatalogSourceEntry[]> };

export type GitHubCatalogBackupRecord = {
  backupId: string;
  backupJobId: string;
  type: BackupType;
  branch: string;
  commitSha: string | null;
  githubPath: string;
  localPath: string;
  status: "COMPLETED";
  manifest: BackupManifest;
};

type CatalogIndex = {
  upsertBackup(record: GitHubCatalogBackupRecord): Promise<void>;
  upsertReindexAudit(record: GitHubCatalogBackupRecord): Promise<void>;
  removeMissingBackups(backupJobIds: string[]): Promise<void>;
};

function hasValidChecksum(manifest: BackupManifest): boolean {
  const { checksum, ...payload } = manifest;
  return createSha256Checksum(JSON.stringify(payload)) === checksum;
}

export function createGitHubBackupCatalogReconciler(input: {
  source: CatalogSource;
  index: CatalogIndex;
  repository: string;
  backupRoot: string;
}) {
  async function reconcileBranch(type: BackupType) {
    const branch = getGitHubBackupBranch(type);
    let entries: CatalogSourceEntry[];
    try {
      entries = await input.source.listBackupManifests(branch);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[reconciler] فشل مسح فرع ${branch}: ${msg}`);
      return { indexed: 0, backupJobIds: [] as string[], scanFailed: true };
    }
    const backupJobIds: string[] = [];
    for (const entry of entries) {
      if (entry.manifest.backupType !== type) continue;
      if (!validateBackupManifest(entry.manifest).valid || !hasValidChecksum(entry.manifest)) continue;
      const record: GitHubCatalogBackupRecord = {
        backupId: entry.backupId,
        backupJobId: entry.manifest.backupJobId,
        type,
        branch,
        commitSha: entry.commitSha,
        githubPath: `https://github.com/${input.repository}/tree/${branch}/backups/${entry.backupId}`,
        localPath: join(input.backupRoot, entry.backupId),
        status: "COMPLETED",
        manifest: entry.manifest,
      };
      await input.index.upsertBackup(record);
      await input.index.upsertReindexAudit(record);
      backupJobIds.push(record.backupJobId);
    }
    return { indexed: backupJobIds.length, backupJobIds, scanFailed: false };
  }

  return {
    reconcileBranch,
    async reconcile() {
      const [database, full] = await Promise.all([reconcileBranch("DATABASE"), reconcileBranch("FULL")]);
      const allFailed = database.scanFailed && full.scanFailed;
      if (allFailed) {
        console.warn("[reconciler] فشل مسح كلا الفرعين — تم تخطي حذف السجلات القديمة للحفاظ على البيانات.");
        return { indexed: 0, database: 0, full: 0, skippedCleanup: true };
      }
      await input.index.removeMissingBackups([...database.backupJobIds, ...full.backupJobIds]);
      return { indexed: database.indexed + full.indexed, database: database.indexed, full: full.indexed, skippedCleanup: false };
    },
  };
}
