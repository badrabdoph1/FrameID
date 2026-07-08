import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";
import { createRestoreService } from "./backup-restore-service";
import { listBackupDirs } from "./local-backup-artifact-writer";

export type TrialRestoreResult = {
  success: boolean;
  backupId: string;
  steps: {
    databaseRestore: boolean;
    filesCopied: boolean;
    manifestValidated: boolean;
    postValidationPassed: boolean;
  };
  errors: string[];
  durationMs: number;
  tempDir: string;
  cleanedUp: boolean;
};

export type RestoreValidationScheduler = {
  runTrialRestore(input: {
    backupId?: string;
    databaseUrl: string;
    backupRoot: string;
  }): Promise<TrialRestoreResult>;
  runScheduledValidation(input: {
    databaseUrl: string;
    backupRoot: string;
  }): Promise<TrialRestoreResult[]>;
};

function getTestDatabaseUrl(originalUrl: string): string {
  const url = new URL(originalUrl);
  const originalDb = url.pathname.replace(/^\//, "");
  const testDb = `${originalDb}_test_restore`;
  url.pathname = `/${testDb}`;
  return url.toString();
}

async function createTestDatabase(
  originalUrl: string
): Promise<{ testUrl: string; cleanedUp: boolean }> {
  const { execSync } = await import("node:child_process");
  const url = new URL(originalUrl);
  const originalDb = url.pathname.replace(/^\//, "");
  const testDb = `${originalDb}_test_restore_${Date.now()}`;
  url.pathname = `/${testDb}`;
  const testUrl = url.toString();
  const parsed = {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: testDb,
  };
  const env = { ...process.env, PGPASSWORD: parsed.password };

  try {
    execSync(
      `createdb --host="${parsed.host}" --port="${parsed.port}" --username="${parsed.user}" --no-password "${parsed.database}" 2>/dev/null || true`,
      { env, stdio: "ignore" }
    );

    execSync(
      `psql --host="${parsed.host}" --port="${parsed.port}" --username="${parsed.user}" --no-password --dbname="${parsed.database}" --command="CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"" 2>/dev/null || true`,
      { env, stdio: "ignore" }
    );
  } catch {}

  return { testUrl, cleanedUp: false };
}

async function dropTestDatabase(
  testUrl: string
): Promise<void> {
  const { execSync } = await import("node:child_process");
  const url = new URL(testUrl);
  const db = url.pathname.replace(/^\//, "");
  const env = {
    ...process.env,
    PGPASSWORD: decodeURIComponent(url.password),
  };

  try {
    execSync(
      `psql --host="${url.hostname}" --port="${url.port || "5432"}" --username="${decodeURIComponent(url.username)}" --no-password --dbname="postgres" --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db}'" 2>/dev/null || true`,
      { env, stdio: "ignore" }
    );
    execSync(
      `dropdb --host="${url.hostname}" --port="${url.port || "5432"}" --username="${decodeURIComponent(url.username)}" --no-password --if-exists "${db}"`,
      { env, stdio: "ignore" }
    );
  } catch {}
}

export function createRestoreValidationScheduler(): RestoreValidationScheduler {
  return {
    async runTrialRestore(input) {
      const startTime = Date.now();
      const errors: string[] = [];
      let tempDir = "";
      let testDbUrl = "";
      let testDbCreated = false;

      const restoreService = createRestoreService();

      const backupId =
        input.backupId ||
        (
          await listBackupDirs(input.backupRoot)
        )[0];

      if (!backupId) {
        return {
          success: false,
          backupId: "",
          steps: {
            databaseRestore: false,
            filesCopied: false,
            manifestValidated: false,
            postValidationPassed: false,
          },
          errors: ["No backups found for trial restore"],
          durationMs: Date.now() - startTime,
          tempDir: "",
          cleanedUp: true,
        };
      }

      tempDir = await mkdtemp(join(tmpdir(), "frameid-trial-restore-"));

      try {
        const validation = await restoreService.validateBackup({
          backupId,
          backupRoot: input.backupRoot,
        });

        if (!validation.valid) {
          errors.push("Backup validation failed");
          return {
            success: false,
            backupId,
            steps: {
              databaseRestore: false,
              filesCopied: false,
              manifestValidated: false,
              postValidationPassed: false,
            },
            errors: [...errors, ...validation.validation.errors],
            durationMs: Date.now() - startTime,
            tempDir,
            cleanedUp: false,
          };
        }

        const { testUrl } = await createTestDatabase(input.databaseUrl);
        testDbUrl = testUrl;
        testDbCreated = true;

        const restoreResult = await restoreService.executeRestore({
          backupId,
          backupRoot: input.backupRoot,
          databaseUrl: testDbUrl,
          uploadsDir: join(tempDir, "uploads"),
          contentDir: join(tempDir, "content"),
          type: "FULL",
          skipChecksumVerification: false,
        });

        if (!restoreResult.success) {
          errors.push(...restoreResult.errors);
        }

        let postValidationPassed = false;
        if (restoreResult.success) {
          try {
            const postValidation = await restoreService.validatePostRestore(testDbUrl);
            postValidationPassed = postValidation.passed;
            if (!postValidation.passed) {
              errors.push("Post-restore validation failed in trial environment");
            }
          } catch (e) {
            errors.push(
              `Post-validation error: ${e instanceof Error ? e.message : "Unknown"}`
            );
          }
        }

        return {
          success: restoreResult.success && postValidationPassed,
          backupId,
          steps: {
            databaseRestore: restoreResult.steps.database,
            filesCopied: restoreResult.steps.uploads || restoreResult.steps.content,
            manifestValidated: validation.valid,
            postValidationPassed,
          },
          errors,
          durationMs: Date.now() - startTime,
          tempDir,
          cleanedUp: false,
        };
      } finally {
        if (testDbCreated && testDbUrl) {
          await dropTestDatabase(testDbUrl).catch(() => {});
        }
        if (tempDir && existsSync(tempDir)) {
          await rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
      }
    },

    async runScheduledValidation(input) {
      const backups = await listBackupDirs(input.backupRoot);
      const latestBackups = backups.slice(0, 1);
      const results: TrialRestoreResult[] = [];

      for (const backupId of latestBackups) {
        const result = await this.runTrialRestore({
          backupId,
          ...input,
        });
        results.push(result);
      }

      return results;
    },
  };
}
