import { existsSync, createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

import { createSha256Checksum, validateBackupManifest, type RestoreValidationResult, type BackupManifest, type BackupType } from "@/modules/backups/backup-manifest";

export type RestoreOptions = {
  backupId: string;
  backupRoot?: string;
  databaseUrl: string;
  uploadsDir?: string;
  contentDir?: string;
  type: BackupType;
  skipChecksumVerification?: boolean;
};

export type RestoreStepResult = { database: boolean; uploads: boolean; content: boolean };
export type RestoreResult = { success: boolean; backupId: string; type: string; validation: RestoreValidationResult; steps: RestoreStepResult; durationMs: number; errors: string[] };
export type PostRestoreValidationResult = { passed: boolean; checks: Record<string, boolean>; counts: Record<string, number>; durationMs: number; errors: string[] };
export type RestorePreview = { backupId: string; type: string; usersCount: number; tenantsCount: number; sitesCount: number; mediaFilesCount: number; databaseSizeBytes: number; uploadsSizeBytes: number; contentSizeBytes: number; totalSizeBytes: number; createdAt: string; appVersion: string; compressionAlgorithm: string; encryptionEnabled: boolean };

export type RestoreService = {
  validateBackup(input: { backupId: string; backupRoot: string }): Promise<{ valid: boolean; manifest: BackupManifest | null; validation: RestoreValidationResult }>;
  getRestorePreview(input: { backupId: string; backupRoot: string }): Promise<RestorePreview | null>;
  executeRestore(options: RestoreOptions): Promise<RestoreResult>;
  validatePostRestore(databaseUrl: string): Promise<PostRestoreValidationResult>;
};

async function fileExists(path: string): Promise<boolean> { try { await stat(path); return true; } catch { return false; } }

function parseDatabaseUrl(url: string): { host: string; port: string; user: string; password: string; database: string } {
  const u = new URL(url);
  return { host: u.hostname, port: u.port || "5432", user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: u.pathname.replace(/^\//, "") };
}

function emptyValidation(errors: string[]): RestoreValidationResult {
  return { valid: false, checks: { manifestValid: false, versionCompatibility: false, schemaCompatibility: false, filesIntegrity: false, integrity: false }, errors };
}

async function runPsqlCommand(databaseUrl: string, sql: string): Promise<string> {
  const parsed = parseDatabaseUrl(databaseUrl);
  const env = { ...process.env, PGPASSWORD: parsed.password };
  const child = spawn("psql", [`--host=${parsed.host}`, `--port=${parsed.port}`, `--username=${parsed.user}`, "--no-password", `--dbname=${parsed.database}`, "--tuples-only", "--no-align", `--command=${sql}`], { env, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += String(chunk); });
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  await new Promise<void>((resolve, reject) => { child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr || `psql exited with code ${code}`))); child.on("error", reject); });
  return stdout.trim();
}

export function createRestoreService(): RestoreService {
  return {
    async validateBackup(input) {
      const manifestPath = join(input.backupRoot, input.backupId, "manifest.json");
      const checksumPath = join(input.backupRoot, input.backupId, "checksum.sha256");
      if (!(await fileExists(manifestPath))) return { valid: false, manifest: null, validation: emptyValidation(["manifest.json not found"]) };

      const manifestContent = await readFile(manifestPath, "utf-8");
      let manifest: BackupManifest;
      try { manifest = JSON.parse(manifestContent) as BackupManifest; }
      catch { return { valid: false, manifest: null, validation: emptyValidation(["Invalid JSON in manifest.json"]) }; }

      const validation = validateBackupManifest(manifest);
      if (await fileExists(checksumPath)) {
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
      const backupRoot = options.backupRoot ?? join(process.cwd(), "backups");
      const backupDir = join(backupRoot, options.backupId);
      if (!existsSync(backupDir)) return { success: false, backupId: options.backupId, type: options.type, validation: emptyValidation(["Backup directory not found"]), steps, durationMs: Date.now() - startTime, errors: [`Backup directory not found: ${backupDir}`] };

      const validationResult = await this.validateBackup({ backupId: options.backupId, backupRoot });
      if (!validationResult.valid && !options.skipChecksumVerification) return { success: false, backupId: options.backupId, type: options.type, validation: validationResult.validation, steps, durationMs: Date.now() - startTime, errors: validationResult.validation.errors };

      const dumpPath = join(backupDir, "database.sql.gz");
      if (await fileExists(dumpPath)) {
        try {
          const parsed = parseDatabaseUrl(options.databaseUrl);
          const env = { ...process.env, PGPASSWORD: parsed.password };
          const psql = spawn("psql", [`--host=${parsed.host}`, `--port=${parsed.port}`, `--username=${parsed.user}`, "--no-password", `--dbname=${parsed.database}`], { env, stdio: ["pipe", "inherit", "pipe"] });
          await pipeline(createReadStream(dumpPath), createGunzip(), psql.stdin);
          await new Promise<void>((resolve, reject) => { psql.on("close", (code) => code === 0 ? resolve() : reject(new Error(`psql exited with code ${code}`))); psql.on("error", reject); });
          steps.database = true;
        } catch (error) { errors.push(error instanceof Error ? error.message : "Database restore failed"); }
      } else errors.push("Database dump file not found");

      if (options.type === "FULL") {
        const archivePath = join(backupDir, "uploads.tar.gz");
        const targetDir = options.uploadsDir ?? join(process.cwd(), "public", "uploads");
        if (await fileExists(archivePath)) {
          try {
            await mkdir(targetDir, { recursive: true });
            const tar = spawn("tar", ["-xzf", archivePath, "-C", targetDir], { stdio: "inherit" });
            await new Promise<void>((resolve, reject) => { tar.on("close", (code) => code === 0 ? resolve() : reject(new Error(`tar exited with code ${code}`))); tar.on("error", reject); });
            steps.uploads = true;
          } catch (error) { errors.push(error instanceof Error ? error.message : "Uploads restore failed"); }
        } else errors.push("Uploads archive not found");
      } else steps.uploads = true;

      return { success: errors.length === 0, backupId: options.backupId, type: options.type, validation: validationResult.validation, steps, durationMs: Date.now() - startTime, errors };
    },

    async validatePostRestore(databaseUrl: string): Promise<PostRestoreValidationResult> {
      const startTime = Date.now();
      const errors: string[] = [];
      const counts: Record<string, number> = {};
      const checks: Record<string, boolean> = {};
      const queries: [string, string][] = [
        ["usersCount", `SELECT COUNT(*) FROM "User" WHERE "deletedAt" IS NULL`],
        ["tenantsCount", `SELECT COUNT(*) FROM "Tenant" WHERE "deletedAt" IS NULL`],
        ["sitesCount", `SELECT COUNT(*) FROM "Site" WHERE "deletedAt" IS NULL`],
        ["mediaAssetsCount", `SELECT COUNT(*) FROM "MediaAsset" WHERE "deletedAt" IS NULL`],
        ["subscriptionsCount", `SELECT COUNT(*) FROM "Subscription"`],
        ["paymentsCount", `SELECT COUNT(*) FROM "PaymentRequest"`],
      ];

      for (const [key, query] of queries) {
        try {
          const count = parseInt(await runPsqlCommand(databaseUrl, query), 10);
          counts[key] = Number.isFinite(count) ? count : -1;
          checks[key] = counts[key] >= 0;
        } catch (error) { errors.push(error instanceof Error ? error.message : `Failed to check ${key}`); counts[key] = -1; checks[key] = false; }
      }

      return { passed: errors.length === 0, checks, counts, durationMs: Date.now() - startTime, errors };
    },
  };
}
