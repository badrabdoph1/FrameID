import { createRestoreService, type RestoreResult } from "./backup-restore-service";
import { listBackupDirs, readBackupManifest } from "./local-backup-artifact-writer";
import { join } from "node:path";

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

export function createAutoRestoreService(): AutoRestoreService {
  const restoreService = createRestoreService();

  async function isDatabaseEmpty(databaseUrl: string): Promise<{
    empty: boolean;
    tableCount: number;
    error?: string;
  }> {
    try {
      const url = new URL(databaseUrl);
      const { exec } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const execAsync = promisify(exec);

      const env = {
        ...process.env,
        PGPASSWORD: decodeURIComponent(url.password),
      };

      const { stdout } = await execAsync(
        `psql --host="${url.hostname}" --port="${url.port || "5432"}" --username="${decodeURIComponent(url.username)}" --no-password --dbname="${url.pathname.replace(/^\//, "")}" --tuples-only --command="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"`,
        { env, timeout: 15000 }
      );

      const count = parseInt(stdout.trim(), 10);
      return { empty: count === 0, tableCount: count };
    } catch (error) {
      return {
        empty: false,
        tableCount: -1,
        error: error instanceof Error ? error.message : "Check failed",
      };
    }
  }

  return {
    async checkAndRestore(options) {
      const root = options.backupRoot ?? join(process.cwd(), "backups");

      const dbCheck = await isDatabaseEmpty(options.databaseUrl);

      if (dbCheck.error) {
        return {
          needed: false,
          restored: false,
          result: null,
          reason: `Cannot check database: ${dbCheck.error}`,
        };
      }

      if (!dbCheck.empty) {
        return {
          needed: false,
          restored: false,
          result: null,
          reason: `Database has ${dbCheck.tableCount} tables, not empty`,
        };
      }

      const backupDirs = await listBackupDirs(root);
      if (backupDirs.length === 0) {
        return {
          needed: true,
          restored: false,
          result: null,
          reason: "Database is empty but no backups found",
        };
      }

      const latestBackup = backupDirs[0];
      const manifest = await readBackupManifest(latestBackup, root);
      const type = manifest?.backupType === "FULL" ? "FULL" : "DATABASE";

      try {
        const validation = await restoreService.validateBackup({
          backupId: latestBackup,
          backupRoot: root,
        });

        if (!validation.valid) {
          return {
            needed: true,
            restored: false,
            result: null,
            reason: `Latest backup (${latestBackup}) failed validation`,
          };
        }

        const result = await restoreService.executeRestore({
          backupId: latestBackup,
          backupRoot: root,
          databaseUrl: options.databaseUrl,
          uploadsDir: options.uploadsDir,
          contentDir: options.contentDir,
          type: type as "DATABASE" | "FULL",
          skipChecksumVerification: false,
        });

        return {
          needed: true,
          restored: result.success,
          result,
          reason: result.success
            ? `Auto-restored from ${latestBackup}`
            : `Auto-restore failed: ${result.errors.join("; ")}`,
        };
      } catch (error) {
        return {
          needed: true,
          restored: false,
          result: null,
          reason: error instanceof Error ? error.message : "Auto-restore failed",
        };
      }
    },
  };
}
