import { existsSync, createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

import type { BackupFileInventoryItem, BackupType } from "@/modules/backups/backup-manifest";
import { createGitHubStorage } from "@/modules/backups/backup-storage-github";
import { CUSTOMER_DATA_COUNT_QUERIES } from "@/modules/backups/customer-data-inventory";
import { validateUploadsInventory } from "@/modules/backups/backup-uploads-inventory";
import { restoreUploadsArchive } from "@/modules/backups/backup-uploads-archive";

export { validateUploadsInventory } from "@/modules/backups/backup-uploads-inventory";
export { restoreUploadsArchive } from "@/modules/backups/backup-uploads-archive";

export type ApplyVerifiedRestoreOptions = {
  backupDir: string;
  databaseUrl: string;
  uploadsDir?: string;
  type: BackupType;
};

export type RestoreStepResult = { database: boolean; uploads: boolean; content: boolean };
export type RestoreResult = { success: boolean; type: string; steps: RestoreStepResult; durationMs: number; errors: string[] };
export type PostRestoreValidationResult = { passed: boolean; checks: Record<string, boolean>; counts: Record<string, number>; durationMs: number; errors: string[] };

export type RestoreService = {
  ensureBackupAvailable(input: { backupId: string; backupRoot: string; type: BackupType; githubToken?: string; githubRepository?: string; githubBranch?: string }): Promise<{ backupDir: string; source: "LOCAL" | "GITHUB" }>;
  applyVerifiedRestore(options: ApplyVerifiedRestoreOptions): Promise<RestoreResult>;
  validatePostRestore(databaseUrl: string): Promise<PostRestoreValidationResult>;
  validateRestoredUploads(uploadsDir: string, expected: BackupFileInventoryItem[]): Promise<{ valid: boolean; errors: string[] }>;
};

function backupBranch(type: BackupType): string {
  if (type === "FULL") return process.env.BACKUP_GITHUB_FULL_BRANCH || "frameid-backups-full";
  if (type === "UPLOADS") return process.env.BACKUP_GITHUB_UPLOADS_BRANCH || "frameid-backups-uploads";
  return process.env.BACKUP_GITHUB_DATABASE_BRANCH || "frameid-backups-database";
}

function parseDatabaseUrl(url: string): { host: string; port: string; user: string; password: string; database: string } {
  const u = new URL(url);
  return { host: u.hostname, port: u.port || "5432", user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: u.pathname.replace(/^\//, "") };
}

async function waitForProcess(child: ReturnType<typeof spawn>, label: string): Promise<void> {
  let stderr = "";
  child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `${label} exited with code ${code}`)));
    child.on("error", reject);
  });
}

async function restoreCustomPostgresDump(databaseUrl: string, dumpPath: string): Promise<void> {
  const parsed = parseDatabaseUrl(databaseUrl);
  const tempDir = await mkdtemp(join(tmpdir(), "pg-restore-"));
  const tempFile = join(tempDir, "dump.sql");

  try {
    await pipeline(
      createReadStream(dumpPath),
      createGunzip(),
      createWriteStream(tempFile)
    );

    await new Promise<void>((resolve, reject) => {
      const pgRestore = spawn("pg_restore", [
        `--host=${parsed.host}`, `--port=${parsed.port}`, `--username=${parsed.user}`, "--no-password",
        `--dbname=${parsed.database}`, "--clean", "--if-exists", "--no-owner", "--no-acl", "--exit-on-error", tempFile,
      ], { env: { ...process.env, PGPASSWORD: parsed.password }, stdio: ["ignore", "inherit", "pipe"] });

      let stderr = "";
      pgRestore.stderr?.on("data", (chunk) => { stderr += String(chunk); });

      pgRestore.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr.trim() || `pg_restore exited with code ${code}`));
        }
      });

      pgRestore.on("error", reject);
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function runPsqlCommand(databaseUrl: string, sql: string): Promise<string> {
  const parsed = parseDatabaseUrl(databaseUrl);
  const child = spawn("psql", [`--host=${parsed.host}`, `--port=${parsed.port}`, `--username=${parsed.user}`, "--no-password", `--dbname=${parsed.database}`, "--tuples-only", "--no-align", `--command=${sql}`], { env: { ...process.env, PGPASSWORD: parsed.password }, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  child.stdout.on("data", (chunk) => { stdout += String(chunk); });
  await waitForProcess(child, "psql");
  return stdout.trim();
}

export function createRestoreService(): RestoreService {
  return {
    async ensureBackupAvailable(input) {
      const backupDir = join(input.backupRoot, input.backupId);
      if (existsSync(backupDir)) return { backupDir, source: "LOCAL" };

      const github = createGitHubStorage(input.githubToken ?? process.env.BACKUP_GITHUB_TOKEN ?? "", input.githubRepository);
      if (!github) throw new Error("النسخة غير موجودة محليًا وBACKUP_GITHUB_TOKEN غير مضبوط لتنزيلها من GitHub.");
      const branch = input.githubBranch ?? backupBranch(input.type);
      await github.downloadBackup(input.backupId, backupDir, branch);
      const remote = await github.verifyBackup(input.backupId, branch);
      if (!remote.valid) throw new Error(`فشل التحقق من نسخة GitHub: ${remote.errors.join("; ")}`);
      return { backupDir, source: "GITHUB" };
    },

    async applyVerifiedRestore(options): Promise<RestoreResult> {
      const startTime = Date.now();
      const errors: string[] = [];
      const steps: RestoreStepResult = { database: false, uploads: false, content: true };

      const files = await readdir(options.backupDir);
      let dbSrc: string | null = null;
      let upSrc: string | null = null;
      for (const f of files) {
        if (f === "manifest.json" || f === "checksum.sha256") continue;
        if (f.startsWith("database.")) dbSrc = join(options.backupDir, f);
        if (f.startsWith("uploads.")) upSrc = join(options.backupDir, f);
      }

      if (options.type !== "UPLOADS" && dbSrc && existsSync(dbSrc)) {
        try { await restoreCustomPostgresDump(options.databaseUrl, dbSrc); steps.database = true; }
        catch (error) { errors.push(error instanceof Error ? error.message : "Database restore failed"); }
      } else { steps.database = true; }

      if ((options.type === "FULL" || options.type === "UPLOADS") && errors.length === 0 && upSrc && existsSync(upSrc)) {
        try { await restoreUploadsArchive(upSrc, options.uploadsDir ?? join(process.cwd(), "public", "uploads")); steps.uploads = true; }
        catch (error) { errors.push(error instanceof Error ? error.message : "Uploads restore failed"); }
      } else if (options.type !== "FULL" && options.type !== "UPLOADS") steps.uploads = true;

      return { success: errors.length === 0, type: options.type, steps, durationMs: Date.now() - startTime, errors };
    },

    async validatePostRestore(databaseUrl) {
      const startTime = Date.now();
      const errors: string[] = [];
      const counts: Record<string, number> = {};
      const checks: Record<string, boolean> = {};
      const queries = Object.entries(CUSTOMER_DATA_COUNT_QUERIES);
      for (const [key, query] of queries) {
        try { const value = Number.parseInt(await runPsqlCommand(databaseUrl, query), 10); counts[key] = Number.isFinite(value) ? value : 0; checks[key] = Number.isFinite(value); }
        catch (error) { checks[key] = false; errors.push(error instanceof Error ? error.message : `Failed check: ${key}`); }
      }
      return { passed: errors.length === 0, checks, counts, durationMs: Date.now() - startTime, errors };
    },
    validateRestoredUploads: validateUploadsInventory,
  };
}
