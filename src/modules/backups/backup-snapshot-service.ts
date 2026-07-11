export type SnapshotOptions = {
  reason: string;
  databaseUrl: string;
  uploadsDir?: string;
  contentDir?: string;
  backupRoot?: string;
  platformVersion: string;
  gitCommitSha?: string;
  initiatedById: string;
};

export type SnapshotResult = {
  backupId: string;
  backupDir: string;
  success: boolean;
  error?: string;
  durationMs: number;
};

export type SnapshotService = {
  createSnapshot(options: SnapshotOptions): Promise<SnapshotResult>;
};

/**
 * Legacy compatibility facade.
 *
 * Local-only migration snapshots are disabled because they bypass the official
 * backup pipeline. A migration package must be created as a FULL backup through
 * BackupJobService so it is verified locally, uploaded to GitHub, verified
 * remotely, retained by policy, and only then marked COMPLETED.
 */
export function createSnapshotService(): SnapshotService {
  return {
    async createSnapshot() {
      return {
        backupId: "",
        backupDir: "",
        success: false,
        error: "Legacy local snapshots are disabled. Create a FULL backup from the backup workspace.",
        durationMs: 0,
      };
    },
  };
}
