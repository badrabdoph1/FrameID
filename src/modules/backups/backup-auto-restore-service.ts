import type { RestoreResult } from "./backup-restore-service";

export type AutoRestoreOptions = {
  databaseUrl: string;
  backupRoot?: string;
  uploadsDir?: string;
  contentDir?: string;
};

export type AutoRestoreService = {
  checkAndRestore(options: AutoRestoreOptions): Promise<{
    needed: boolean;
    restored: boolean;
    result: RestoreResult | null;
    reason: string;
  }>;
};

/**
 * Legacy compatibility facade.
 *
 * Automatic restore from the local filesystem is intentionally disabled because
 * it bypasses the verified GitHub restore workflow. Production recovery must be
 * initiated through the admin backup workspace, which downloads from GitHub
 * when the local artifact is missing and verifies the artifact before restore.
 */
export function createAutoRestoreService(): AutoRestoreService {
  return {
    async checkAndRestore() {
      return {
        needed: false,
        restored: false,
        result: null,
        reason: "Legacy local auto-restore is disabled. Use the verified GitHub restore workflow.",
      };
    },
  };
}
