import { existsSync, createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

import {
  createSha256Checksum,
  validateBackupManifest,
  type RestoreValidationResult,
  type BackupManifest,
  type BackupType,
} from "@/modules/backups/backup-manifest";
import { createGitHubStorage } from "@/modules/backups/backup-storage-github";

export type RestoreOptions = {
  backupId: string;
  backupRoot?: string;
  databaseUrl: string;
  uploadsDir?: string;
  contentDir?: string;
  type: BackupType;
  skipChecksumVerification?: boolean;
  githubToken?: string;
  githubRepository?: string;
  githubBranch?: string;
};

export type RestoreStepResult = { database: boolean; uploads: boolean; content: boolean };
export type RestoreResult = { success: boolean; backupId: string; type: string; validation: RestoreValidationResult; steps: RestoreStepResult; durationMs: number; errors: string[]; source: "LOCAL" | "GITHUB" };
export type PostRestoreValidationResult = { passed: boolean; checks: Record<string, boolean>; counts: Record<string, number>; durationMs: number; errors: string[] };
export type RestorePreview = { backupId: string; type: string; usersCount: number; tenantsCount: number; sitesCount: number; mediaFilesCount: number; databaseSizeBytes: number; uploadsSizeBytes: number; contentSizeBytes: number; totalSizeBytes: number; createdAt: string; appVersion: string; compressionAlgorithm: string; encryptionEnabled: boolean };

export type RestoreService = {
  ensureBackupAvailable(input: { backupId: string; backupRoot: string; type: BackupType; githubToken?: string; githubRepository?: string; githubBranch?: string }): Promise<{ backupDir: string; source: "LOCAL" | "GITHUB" }>;
  validateBackup(input: { backupId: string; backupRoot: string }): Promise<{ valid: boolean; manifest: BackupManifest | null; validation: RestoreValidationResult }>;
  getRestorePreview(input: { backupId: string; backupRoot: string }): Promise<RestorePreview | null>;
  executeRestore(options: RestoreOptions): Promise<RestoreResult>;
  validatePostRestore(databaseUrl: string): Promise<PostRestoreValidationResult>;
};

async function fileExists(path: string): Promise<boolean> { try { await stat(path); return true; } catch { return false; } }
function backupBranch(type: BackupType): string { return type === "FULL" ? process.env.BACKUP_GITHUB_FULL_BRANCH || "frameid-backups-full" : process.env.BACKUP_GITHUB_DATABASE_BRANCH || "frameid-backups-database"; }

function parseDatabaseUrl(url: string): { host: string; port: string; user: string; password: string; database: string } {
  const u = new URL(url);
  return { host: u.hostname, port: u.port || "5432", user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: u.pathname.replace(/^\//, "") };
}

function emptyValidation(errors: string[]): RestoreValidationResult {
  return { valid: false, checks: { manifestValid: false, versionCompatibility: false, schemaCompatibility: false, filesIntegrity: false, integrity: false }, errors };
}

async function waitForProcess(child: ReturnType<typeof spawn>, label: string): Promise<void> {
  let stderr = "";
  child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `${label} exited with code ${code}`)));
    child.on("error", reject);
  });
}

async function verifyCustomPostgresDump(dumpPath: string): Promise<void> {
  const pgRestore = spawn("pg_restore", ["--list", "-"], { stdio: ["pipe", "ignore", "pipe"] });
  const processPromise = waitForProcess(pgRestore, "pg_restore verification");
  await pipeline(createReadStream(dumpPath), createGunzip(), pgRestore.stdin);
  await processPromise;
}

async function restoreCustomPostgresDump(databaseUrl: string, dumpPath: string): Promise<void> {
  const parsed = parseDatabaseUrl(databaseUrl);
  const pgRestore = spawn("pg_restore", [
    `--host=${parsed.host}`, `--port=${parsed.port}`, `--username=${parsed.user}`, "--no-password",
    `--dbname=${parsed.database}`, "--clean", "--if-exists", "--no-owner", "--no-acl", "--exit-on-error", "-",
  ], { env: { ...process.env, PGPASSWORD: parsed.password }, stdio: ["pipe", "inherit", "pipe"] });
  const processPromise = waitForProcess(pgRestore, "pg_restore");
  await pipeline(createReadStream(dumpPath), createGunzip(), pgRestore.stdin);
  await processPromise;
}

async function extractArchive(archivePath: string, targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  const tar = spawn("tar", ["-xzf", archivePath, "-C", targetDir, "--strip-components=1"], { stdio: ["ignore", "inherit", "pipe"] });
  await waitForProcess(tar, "tar restore");
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

    async validateBackup(input) {
      const manifestPath = join(input.backupRoot, input.backupId, "manifest.json");
      const checksumPath = join(input.backupRoot, input.backupId, "checksum.sha256");
      if (!(await fileExists(manifestPath))) return { valid: false, manifest: null, validation: emptyValidation(["manifest.json not found"]) };

      const manifestContent = await readFile(manifestPath, "utf-8");
      let manifest: BackupManifest;
      try { manifest = JSON.parse(manifestContent) as BackupManifest; }
      catch { return { valid: false, manifest: null, validation: emptyValidation(["Invalid JSON in manifest.json"]) }; }

      const validation = validateBackupManifest(manifest);
      if (!(await fileExists(checksumPath))) {
        validation.valid = false;
        validation.checks.integrity = false;
        validation.errors.push("checksum.sha256 not found");
      } else {
        const expectedChecksum = (await readFile(checksumPath, "utf-8")).trim();
        const actualChecksum = createSha256Checksum(manifestContent);
        if (expectedChecksum !== actualChecksum) { validation.valid = false; validation.checks.integrity = false; validation.errors.push("Manifest checksum mismatch"); }
        else validation.checks.integrity = true;
      }

      const backupDir = join(input.backupRoot, input.backupId);
      const requiredFiles = ["database.sql.gz", ...(manifest.backupType === "FULL" ? ["uploads.tar.gz"] : [])];
      for (const fileName of requiredFiles) {
        if (!(await fileExists(join(backupDir, fileName)))) { validation.valid = false; validation.checks.filesIntegrity = false; validation.errors.push(`Required file not found: ${fileName}`); }
      }

      const dumpPath = join(backupDir, "database.sql.gz");
      if (await fileExists(dumpPath)) {
        try { await verifyCustomPostgresDump(dumpPath); }
        catch (error) { validation.valid = false; validation.checks.filesIntegrity = false; validation.errors.push(error instanceof Error ? error.message : "Invalid PostgreSQL dump"); }
      }

      validation.valid = validation.errors.length === 0;
      return { valid: validation.valid, manifest, validation };
    },

    async getRestorePreview(input) {
      const manifestPath = join(input.backupRoot, input.backupId, "manifest.json");
      if (!(await fileExists(manifestPath))) return null;
      try {
        const m = JSON.parse(await readFile(manifestPath, "utf-8")) as BackupManifest;
        return { backupId: input.backupId, type: m.backupType, usersCount: m.usersCount, tenantsCount: m.tenantsCount, sitesCount: m.sitesCount, mediaFilesCount: m.mediaFilesCount, databaseSizeBytes: m.databaseSizeBytes, uploadsSizeBytes: m.uploadsSizeBytes, contentSizeBytes: m.contentSizeBytes, totalSizeBytes: m.totalSizeBytes, createdAt: m.createdAt, appVersion: m.appVersion, compressionAlgorithm: m.compressionAlgorithm, encryptionEnabled: m.encryptionEnabled };
      } catch { return null; }
    },

    async executeRestore(options): Promise<RestoreResult> {
      const startTime = Date.now();
      const errors: string[] = [];
      const steps: RestoreStepResult = { database: false, uploads: false, content: true };
      const backupRoot = options.backupRoot ?? process.env.BACKUP_DIR ?? join(process.cwd(), "backups");
      let source: "LOCAL" | "GITHUB" = "LOCAL";

      try {
        const available = await this.ensureBackupAvailable({ backupId: options.backupId, backupRoot, type: options.type, githubToken: options.githubToken, githubRepository: options.githubRepository, githubBranch: options.githubBranch });
        source = available.source;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Backup is unavailable";
        return { success: false, backupId: options.backupId, type: options.type, validation: emptyValidation([message]), steps, durationMs: Date.now() - startTime, errors: [message], source };
      }

      const backupDir = join(backupRoot, options.backupId);
      const validationResult = await this.validateBackup({ backupId: options.backupId, backupRoot });
      if (!validationResult.valid && !options.skipChecksumVerification) return { success: false, backupId: options.backupId, type: options.type, validation: validationResult.validation, steps, durationMs: Date.now() - startTime, errors: validationResult.validation.errors, source };

      try { await restoreCustomPostgresDump(options.databaseUrl, join(backupDir, "database.sql.gz")); steps.database = true; }
      catch (error) { errors.push(error instanceof Error ? error.message : "Database restore failed"); }

      if (options.type === "FULL" && errors.length === 0) {
        try { await extractArchive(join(backupDir, "uploads.tar.gz"), options.uploadsDir ?? join(process.cwd(), "public", "uploads")); steps.uploads = true; }
        catch (error) { errors.push(error instanceof Error ? error.message : "Uploads restore failed"); }
      } else if (options.type !== "FULL") steps.uploads = true;

      return { success: errors.length === 0, backupId: options.backupId, type: options.type, validation: validationResult.validation, steps, durationMs: Date.now() - startTime, errors, source };
    },

    async validatePostRestore(databaseUrl) {
      const startTime = Date.now();
      const errors: string[] = [];
      const counts: Record<string, number> = {};
      const checks: Record<string, boolean> = {};
      const queries: [string, string][] = [
        ["usersCount", `SELECT COUNT(*) FROM "User" WHERE "deletedAt" IS NULL`],
        ["tenantsCount", `SELECT COUNT(*) FROM "Tenant" WHERE "deletedAt" IS NULL`],
        ["sitesCount", `SELECT COUNT(*) FROM "Site" WHERE "deletedAt" IS NULL`],
      ];
      for (const [key, query] of queries) {
        try { const value = Number.parseInt(await runPsqlCommand(databaseUrl, query), 10); counts[key] = Number.isFinite(value) ? value : 0; checks[key] = Number.isFinite(value); }
        catch (error) { checks[key] = false; errors.push(error instanceof Error ? error.message : `Failed check: ${key}`); }
      }
      return { passed: errors.length === 0, checks, counts, durationMs: Date.now() - startTime, errors };
    },
  };
}
