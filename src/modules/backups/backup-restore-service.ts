import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

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

export type RestoreResult = {
  success: boolean;
  backupId: string;
  type: string;
  validation: RestoreValidationResult;
  steps: {
    database: boolean;
    uploads: boolean;
    content: boolean;
  };
  durationMs: number;
  errors: string[];
};

export type PostRestoreValidationResult = {
  passed: boolean;
  checks: {
    usersCount: boolean;
    tenantsCount: boolean;
    sitesCount: boolean;
    mediaAssetsCount: boolean;
    subscriptionsCount: boolean;
    paymentsCount: boolean;
    settingsCount: boolean;
    themesCount: boolean;
    templatesCount: boolean;
    seoSettingsCount: boolean;
    galleryAlbumsCount: boolean;
    galleryImagesCount: boolean;
    packagesCount: boolean;
    extraServicesCount: boolean;
    contactProfilesCount: boolean;
    backupSettingsCount: boolean;
    adminUsersCount: boolean;
  };
  counts: Record<string, number>;
  durationMs: number;
  errors: string[];
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

export function createRestoreService(): RestoreService {
  return {
    async validateBackup(input) {
      const manifestPath = join(input.backupRoot, input.backupId, "manifest.json");
      const checksumPath = join(input.backupRoot, input.backupId, "checksum.sha256");

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
        const expectedChecksum = (await readFile(checksumPath, "utf-8")).trim();
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
        if (fileName === "manifest.json" || fileName === "checksum.sha256") continue;
        const filePath = join(backupDir, fileName);
        if (!(await fileExists(filePath))) {
          validation.valid = false;
          validation.checks.filesIntegrity = false;
          validation.errors.push(`Required file not found: ${fileName}`);
        }
      }

      return { valid: validation.valid, manifest, validation };
    },

    async executeRestore(options: RestoreOptions): Promise<RestoreResult> {
      const startTime = Date.now();
      const errors: string[] = [];
      const steps = { database: false, uploads: false, content: false };

      const backupDir = join(
        options.backupRoot ?? join(process.cwd(), "backups"),
        options.backupId
      );

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
            errors: [`Backup directory not found: ${backupDir}`],
          },
          steps,
          durationMs: Date.now() - startTime,
          errors: [`Backup directory not found: ${backupDir}`],
        };
      }

      const validationResult = await this.validateBackup({
        backupId: options.backupId,
        backupRoot: options.backupRoot ?? join(process.cwd(), "backups"),
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
            await execAsync(
              `gunzip -c "${dumpPath}" | psql "${options.databaseUrl}"`,
              {
                maxBuffer: 1024 * 1024 * 1024,
                env: { ...process.env },
                timeout: 300000,
              }
            );
            steps.database = true;
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Database restore failed";
            errors.push(msg);
          }
        } else {
          errors.push("Database dump file not found");
        }
      }

      if (restoreUploads) {
        const archivePath = join(backupDir, "uploads.tar.gz");
        const uploadsDir = options.uploadsDir ?? join(process.cwd(), "public", "uploads");
        if (await fileExists(archivePath)) {
          try {
            await execAsync(
              `mkdir -p "${uploadsDir}" && tar -xzf "${archivePath}" -C "/"`,
              { maxBuffer: 1024 * 1024 * 1024, timeout: 120000 }
            );
            steps.uploads = true;
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Uploads restore failed";
            errors.push(msg);
          }
        } else if (options.type === "UPLOADS") {
          errors.push("Uploads archive not found");
        }
      }

      if (restoreFull) {
        const archivePath = join(backupDir, "content.tar.gz");
        const contentDir = options.contentDir ?? join(process.cwd(), "content");
        if (await fileExists(archivePath)) {
          try {
            await execAsync(
              `mkdir -p "${contentDir}" && tar -xzf "${archivePath}" -C "/"`,
              { maxBuffer: 1024 * 1024 * 1024, timeout: 120000 }
            );
            steps.content = true;
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Content restore failed";
            errors.push(msg);
          }
        }
      }

      const durationMs = Date.now() - startTime;

      return {
        success: errors.length === 0,
        backupId: options.backupId,
        type: options.type,
        validation: validationResult.validation,
        steps,
        durationMs,
        errors,
      };
    },

    async validatePostRestore(databaseUrl: string): Promise<PostRestoreValidationResult> {
      const errors: string[] = [];
      const counts: Record<string, number> = {};
      const checks: PostRestoreValidationResult["checks"] = {
        usersCount: false,
        tenantsCount: false,
        sitesCount: false,
        mediaAssetsCount: false,
        subscriptionsCount: false,
        paymentsCount: false,
        settingsCount: false,
        themesCount: false,
        templatesCount: false,
        seoSettingsCount: false,
        galleryAlbumsCount: false,
        galleryImagesCount: false,
        packagesCount: false,
        extraServicesCount: false,
        contactProfilesCount: false,
        backupSettingsCount: false,
        adminUsersCount: false,
      };

      const queries: [keyof PostRestoreValidationResult["checks"], string][] = [
        ["usersCount", "SELECT COUNT(*) as c FROM \"User\" WHERE \"deletedAt\" IS NULL"],
        ["tenantsCount", "SELECT COUNT(*) as c FROM \"Tenant\" WHERE \"deletedAt\" IS NULL"],
        ["sitesCount", "SELECT COUNT(*) as c FROM \"Site\" WHERE \"deletedAt\" IS NULL"],
        ["mediaAssetsCount", "SELECT COUNT(*) as c FROM \"MediaAsset\" WHERE \"deletedAt\" IS NULL"],
        ["subscriptionsCount", "SELECT COUNT(*) as c FROM \"Subscription\" WHERE \"deletedAt\" IS NULL"],
        ["paymentsCount", "SELECT COUNT(*) as c FROM \"PaymentRequest\""],
        ["settingsCount", "SELECT COUNT(*) as c FROM \"BackupSettings\""],
        ["themesCount", "SELECT COUNT(*) as c FROM \"Theme\" WHERE \"deletedAt\" IS NULL"],
        ["templatesCount", "SELECT COUNT(*) as c FROM \"Template\" WHERE \"deletedAt\" IS NULL"],
        ["seoSettingsCount", "SELECT COUNT(*) as c FROM \"SEOSettings\""],
        ["galleryAlbumsCount", "SELECT COUNT(*) as c FROM \"GalleryAlbum\" WHERE \"deletedAt\" IS NULL"],
        ["galleryImagesCount", "SELECT COUNT(*) as c FROM \"GalleryImage\" WHERE \"deletedAt\" IS NULL"],
        ["packagesCount", "SELECT COUNT(*) as c FROM \"Package\" WHERE \"deletedAt\" IS NULL"],
        ["extraServicesCount", "SELECT COUNT(*) as c FROM \"ExtraService\" WHERE \"deletedAt\" IS NULL"],
        ["contactProfilesCount", "SELECT COUNT(*) as c FROM \"ContactProfile\" WHERE \"deletedAt\" IS NULL"],
        ["backupSettingsCount", "SELECT COUNT(*) as c FROM \"BackupSettings\""],
        ["adminUsersCount", "SELECT COUNT(*) as c FROM \"AdminUser\""],
      ];

      for (const [key, query] of queries) {
        try {
          const { stdout } = await execAsync(
            `psql "${databaseUrl}" --tuples-only --command="${query}"`,
            { env: { ...process.env }, timeout: 30000 }
          );
          const count = parseInt(stdout.trim(), 10);
          counts[key] = count;
          checks[key] = count > 0;
        } catch (error) {
          const msg = error instanceof Error ? error.message : `Failed to check ${key}`;
          errors.push(msg);
          counts[key] = -1;
        }
      }

      const passed = errors.length === 0;

      return {
        passed,
        checks,
        counts,
        durationMs: 0,
        errors,
      };
    },
  };
}
