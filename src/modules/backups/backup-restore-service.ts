import { existsSync } from "node:fs";
import { readFile, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

import {
  createSha256Checksum,
  validateBackupManifest,
  type RestoreValidationResult,
  type BackupManifest,
} from "@/modules/backups/backup-manifest";

const execAsync = promisify(exec);

export type RestoreOptions = {
  backupId: string;
  backupRoot?: string;
  databaseUrl: string;
  uploadsDir?: string;
  contentDir?: string;
  type: "DATABASE" | "UPLOADS" | "FULL";
  skipChecksumVerification?: boolean;
};

export type RestoreStepResult = {
  database: boolean;
  uploads: boolean;
  content: boolean;
};

export type RestoreResult = {
  success: boolean;
  backupId: string;
  type: string;
  validation: RestoreValidationResult;
  steps: RestoreStepResult;
  durationMs: number;
  errors: string[];
};

export type PostRestoreValidationResult = {
  passed: boolean;
  checks: Record<string, boolean>;
  counts: Record<string, number>;
  durationMs: number;
  errors: string[];
};

export type RestorePreview = {
  backupId: string;
  type: string;
  usersCount: number;
  tenantsCount: number;
  sitesCount: number;
  mediaFilesCount: number;
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  totalSizeBytes: number;
  createdAt: string;
  appVersion: string;
  compressionAlgorithm: string;
  encryptionEnabled: boolean;
};

export type RestoreService = {
  validateBackup(input: {
    backupId: string;
    backupRoot: string;
  }): Promise<{
    valid: boolean;
    manifest: BackupManifest | null;
    validation: RestoreValidationResult;
  }>;
  getRestorePreview(input: {
    backupId: string;
    backupRoot: string;
  }): Promise<RestorePreview | null>;
  executeRestore(options: RestoreOptions): Promise<RestoreResult>;
  validatePostRestore(databaseUrl: string): Promise<PostRestoreValidationResult>;
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function parseDatabaseUrl(url: string): {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
} {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || "5432",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
  };
}

export function createRestoreService(): RestoreService {
  return {
    async validateBackup(input) {
      const manifestPath = join(
        input.backupRoot,
        input.backupId,
        "manifest.json"
      );
      const checksumPath = join(
        input.backupRoot,
        input.backupId,
        "checksum.sha256"
      );

      if (!(await fileExists(manifestPath))) {
        return {
          valid: false,
          manifest: null,
          validation: {
            valid: false,
            checks: {
              manifestValid: false,
              versionCompatibility: false,
              schemaCompatibility: false,
              filesIntegrity: false,
              integrity: false,
            },
            errors: ["manifest.json not found"],
          },
        };
      }

      const manifestContent = await readFile(manifestPath, "utf-8");
      let manifest: BackupManifest;
      try {
        manifest = JSON.parse(manifestContent);
      } catch {
        return {
          valid: false,
          manifest: null,
          validation: {
            valid: false,
            checks: {
              manifestValid: false,
              versionCompatibility: false,
              schemaCompatibility: false,
              filesIntegrity: true,
              integrity: false,
            },
            errors: ["Invalid JSON in manifest.json"],
          },
        };
      }

      const validation = validateBackupManifest(manifest);
      if (!validation.valid) {
        return { valid: false, manifest, validation };
      }

      if (await fileExists(checksumPath)) {
        const expectedChecksum = (
          await readFile(checksumPath, "utf-8")
        ).trim();
        const actualChecksum = createSha256Checksum(manifestContent);
        if (expectedChecksum !== actualChecksum) {
          validation.valid = false;
          validation.checks.integrity = false;
          validation.errors.push("Manifest checksum mismatch");
        } else {
          validation.checks.integrity = true;
        }
      }

      const files = manifest.files || {};
      const requiredFiles = Object.values(files) as string[];
      const backupDir = join(input.backupRoot, input.backupId);

      for (const fileName of requiredFiles) {
        if (fileName === "manifest.json" || fileName === "checksum.sha256")
          continue;
        const filePath = join(backupDir, fileName);
        if (!(await fileExists(filePath))) {
          validation.valid = false;
          validation.checks.filesIntegrity = false;
          validation.errors.push(`Required file not found: ${fileName}`);
        }
      }

      return { valid: validation.valid, manifest, validation };
    },

    async getRestorePreview(input) {
      const manifestPath = join(
        input.backupRoot,
        input.backupId,
        "manifest.json"
      );
      if (!(await fileExists(manifestPath))) return null;

      try {
        const content = await readFile(manifestPath, "utf-8");
        const m = JSON.parse(content) as BackupManifest;
        return {
          backupId: input.backupId,
          type: m.backupType,
          usersCount: m.usersCount,
          tenantsCount: m.tenantsCount,
          sitesCount: m.sitesCount,
          mediaFilesCount: m.mediaFilesCount,
          databaseSizeBytes: m.databaseSizeBytes,
          uploadsSizeBytes: m.uploadsSizeBytes,
          contentSizeBytes: m.contentSizeBytes,
          totalSizeBytes: m.totalSizeBytes,
          createdAt: m.createdAt,
          appVersion: m.appVersion,
          compressionAlgorithm: m.compressionAlgorithm,
          encryptionEnabled: m.encryptionEnabled,
        };
      } catch {
        return null;
      }
    },

    async executeRestore(options: RestoreOptions): Promise<RestoreResult> {
      const startTime = Date.now();
      const errors: string[] = [];
      const steps: RestoreStepResult = {
        database: false,
        uploads: false,
        content: false,
      };

      const backupRoot =
        options.backupRoot ?? join(process.cwd(), "backups");
      const backupDir = join(backupRoot, options.backupId);

      if (!existsSync(backupDir)) {
        return {
          success: false,
          backupId: options.backupId,
          type: options.type,
          validation: {
            valid: false,
            checks: {
              manifestValid: false,
              versionCompatibility: false,
              schemaCompatibility: false,
              filesIntegrity: false,
              integrity: false,
            },
            errors: [`Backup directory not found`],
          },
          steps,
          durationMs: Date.now() - startTime,
          errors: [`Backup directory not found: ${backupDir}`],
        };
      }

      const validationResult = await this.validateBackup({
        backupId: options.backupId,
        backupRoot,
      });

      if (!validationResult.valid && !options.skipChecksumVerification) {
        return {
          success: false,
          backupId: options.backupId,
          type: options.type,
          validation: validationResult.validation,
          steps,
          durationMs: Date.now() - startTime,
          errors: validationResult.validation.errors,
        };
      }

      const restoreFull = options.type === "FULL";
      const restoreDb = options.type === "DATABASE" || restoreFull;
      const restoreUploads = options.type === "UPLOADS" || restoreFull;

      if (restoreDb) {
        const dumpPath = join(backupDir, "database.sql.gz");
        if (await fileExists(dumpPath)) {
          try {
            const parsed = parseDatabaseUrl(options.databaseUrl);
            const env = { ...process.env, PGPASSWORD: parsed.password };

            const psql = spawn(
              "psql",
              [
                `--host=${parsed.host}`,
                `--port=${parsed.port}`,
                `--username=${parsed.user}`,
                `--no-password`,
                `--dbname=${parsed.database}`,
              ],
              { env, stdio: ["pipe", "inherit", "pipe"] }
            );

            const gunzip = createGunzip();
            const readStream = createReadStream(dumpPath);

            await pipeline(readStream, gunzip, psql.stdin);

            await new Promise<void>((resolve, reject) => {
              psql.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`psql exited with code ${code}`));
              });
              psql.on("error", reject);
            });

            steps.database = true;
          } catch (error) {
            const msg =
              error instanceof Error
                ? error.message
                : "Database restore failed";
            errors.push(msg);
          }
        } else {
          errors.push("Database dump file not found");
        }
      }

      if (restoreUploads) {
        const archivePath = join(backupDir, "uploads.tar.gz");
        const targetDir =
          options.uploadsDir ?? join(process.cwd(), "public", "uploads");
        if (await fileExists(archivePath)) {
          try {
            await mkdir(targetDir, { recursive: true });
            const tar = spawn("tar", ["-xzf", archivePath, "-C", targetDir], {
              stdio: "inherit",
            });
            await new Promise<void>((resolve, reject) => {
              tar.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`tar exited with code ${code}`));
              });
              tar.on("error", reject);
            });
            steps.uploads = true;
          } catch (error) {
            const msg =
              error instanceof Error
                ? error.message
                : "Uploads restore failed";
            errors.push(msg);
          }
        } else if (options.type === "UPLOADS") {
          errors.push("Uploads archive not found");
        }
      }

      if (restoreFull) {
        const archivePath = join(backupDir, "content.tar.gz");
        const targetDir =
          options.contentDir ?? join(process.cwd(), "content");
        if (await fileExists(archivePath)) {
          try {
            await mkdir(targetDir, { recursive: true });
            const tar = spawn("tar", ["-xzf", archivePath, "-C", targetDir], {
              stdio: "inherit",
            });
            await new Promise<void>((resolve, reject) => {
              tar.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`tar exited with code ${code}`));
              });
              tar.on("error", reject);
            });
            steps.content = true;
          } catch (error) {
            const msg =
              error instanceof Error
                ? error.message
                : "Content restore failed";
            errors.push(msg);
          }
        }
      }

      return {
        success: errors.length === 0,
        backupId: options.backupId,
        type: options.type,
        validation: validationResult.validation,
        steps,
        durationMs: Date.now() - startTime,
        errors,
      };
    },

    async validatePostRestore(
      databaseUrl: string
    ): Promise<PostRestoreValidationResult> {
      const errors: string[] = [];
      const counts: Record<string, number> = {};
      const checks: Record<string, boolean> = {};

      const queries: [string, string][] = [
        ["usersCount", `SELECT COUNT(*) as c FROM "User" WHERE "deletedAt" IS NULL`],
        ["tenantsCount", `SELECT COUNT(*) as c FROM "Tenant" WHERE "deletedAt" IS NULL`],
        ["sitesCount", `SELECT COUNT(*) as c FROM "Site" WHERE "deletedAt" IS NULL`],
        ["mediaAssetsCount", `SELECT COUNT(*) as c FROM "MediaAsset" WHERE "deletedAt" IS NULL`],
        ["subscriptionsCount", `SELECT COUNT(*) as c FROM "Subscription" WHERE "deletedAt" IS NULL`],
        ["paymentsCount", `SELECT COUNT(*) as c FROM "PaymentRequest"`],
        ["settingsCount", `SELECT COUNT(*) as c FROM "BackupSettings"`],
        ["themesCount", `SELECT COUNT(*) as c FROM "Theme" WHERE "deletedAt" IS NULL`],
        ["templatesCount", `SELECT COUNT(*) as c FROM "Template" WHERE "deletedAt" IS NULL`],
        ["seoSettingsCount", `SELECT COUNT(*) as c FROM "SEOSettings"`],
        ["galleryAlbumsCount", `SELECT COUNT(*) as c FROM "GalleryAlbum" WHERE "deletedAt" IS NULL`],
        ["galleryImagesCount", `SELECT COUNT(*) as c FROM "GalleryImage" WHERE "deletedAt" IS NULL`],
        ["packagesCount", `SELECT COUNT(*) as c FROM "Package" WHERE "deletedAt" IS NULL`],
        ["extraServicesCount", `SELECT COUNT(*) as c FROM "ExtraService" WHERE "deletedAt" IS NULL`],
        ["contactProfilesCount", `SELECT COUNT(*) as c FROM "ContactProfile"`],
        ["backupSettingsCount", `SELECT COUNT(*) as c FROM "BackupSettings"`],
        ["adminUsersCount", `SELECT COUNT(*) as c FROM "AdminUser"`],
      ];

      const parsed = parseDatabaseUrl(databaseUrl);
      const env = { ...process.env, PGPASSWORD: parsed.password };

      for (const [key, query] of queries) {
        try {
          const escapedQuery = query.replace(/"/g, '\\"');
          const { stdout } = await execAsync(
            `psql --host="${parsed.host}" --port="${parsed.port}" --username="${parsed.user}" --no-password --dbname="${parsed.database}" --tuples-only --command="${escapedQuery}"`,
            { env, timeout: 30000 }
          );
          const count = parseInt(stdout.trim(), 10);
          counts[key] = isNaN(count) ? -1 : count;
          checks[key] = count > 0;
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : `Failed to check ${key}`;
          errors.push(msg);
          counts[key] = -1;
          checks[key] = false;
        }
      }

      return {
        passed: errors.length === 0,
        checks,
        counts,
        durationMs: 0,
        errors,
      };
    },
  };
}
