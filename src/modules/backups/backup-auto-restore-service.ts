import { existsSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "@/lib/prisma";
import { createRestoreService } from "./backup-restore-service";
import { createGitHubStorage } from "./backup-storage-github";
import { createPrismaBackupJobRepository } from "./prisma-backup-job-repository";
import { isSupportedBackupType } from "./backup-policy";
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
 * Auto-restore from GitHub on fresh deployment.
 * Checks if the database is empty (no users) and tries to restore the latest
 * backup from GitHub. This enables zero-downtime migration between hostings.
 */
export function createAutoRestoreService(): AutoRestoreService {
  return {
    async checkAndRestore(options) {
      const backupRoot = options.backupRoot ?? process.env.BACKUP_DIR ?? join(process.cwd(), "backups");
      const githubToken = process.env.BACKUP_GITHUB_TOKEN;
      const githubRepository = process.env.BACKUP_GITHUB_REPOSITORY;

      // Check if auto-restore is possible
      if (!githubToken || !githubRepository) {
        return {
          needed: false,
          restored: false,
          result: null,
          reason: "BACKUP_GITHUB_TOKEN or BACKUP_GITHUB_REPOSITORY not configured. Cannot auto-restore.",
        };
      }

      try {
        // Check if database has users — if yes, no restore needed
        const userCount = await prisma.user.count();
        if (userCount > 0) {
          return {
            needed: false,
            restored: false,
            result: null,
            reason: "Database already has users. No auto-restore needed.",
          };
        }

        // Database is empty — find latest backup on GitHub
        const github = createGitHubStorage(githubToken, githubRepository);
        if (!github) {
          return {
            needed: true,
            restored: false,
            result: null,
            reason: "GitHub storage not available.",
          };
        }

        // Try DATABASE backup first, then FULL
        const backupTypes = ["DATABASE", "FULL"] as const;
        for (const backupType of backupTypes) {
          if (!isSupportedBackupType(backupType)) continue;
          const branch = backupType === "FULL"
            ? process.env.BACKUP_GITHUB_FULL_BRANCH || "frameid-backups-full"
            : process.env.BACKUP_GITHUB_DATABASE_BRANCH || "frameid-backups-database";

          try {
            const backups = await github.listBackups(branch);
            const latestBackup = backups[0];
            if (!latestBackup) continue;

            console.log(`[auto-restore] Found backup ${latestBackup} on branch ${branch}. Restoring...`);

            const restoreService = createRestoreService();
            const result = await restoreService.executeRestore({
              backupId: latestBackup,
              backupRoot,
              databaseUrl: options.databaseUrl,
              type: backupType,
              githubToken,
              githubRepository,
              githubBranch: branch,
            });

            if (result.success) {
              console.log(`[auto-restore] Successfully restored backup ${latestBackup} (${result.durationMs}ms)`);
              return {
                needed: true,
                restored: true,
                result,
                reason: `Auto-restored backup ${latestBackup} from GitHub.`,
              };
            }

            console.error(`[auto-restore] Restore failed for ${latestBackup}:`, result.errors);
          } catch (error) {
            console.error(`[auto-restore] Error restoring ${backupType} from branch ${branch}:`, error);
          }
        }

        return {
          needed: true,
          restored: false,
          result: null,
          reason: "Database is empty but no backup could be restored from GitHub.",
        };
      } catch (error) {
        return {
          needed: false,
          restored: false,
          result: null,
          reason: `Auto-restore check failed: ${error instanceof Error ? error.message : "unknown"}`,
        };
      }
    },
  };
}
