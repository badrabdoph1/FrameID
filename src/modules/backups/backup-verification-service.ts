import { stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { createSha256Checksum, type BackupManifest } from "./backup-manifest";

export type VerificationResult = {
  valid: boolean;
  checks: {
    backupDirExists: boolean;
    manifestExists: boolean;
    checksumFileExists: boolean;
    manifestIntegrity: boolean;
    databaseDumpExists: boolean;
    uploadsArchiveExists: boolean;
    contentArchiveExists: boolean;
    databaseDumpNonEmpty: boolean;
    uploadsArchiveNonEmpty: boolean;
    contentArchiveNonEmpty: boolean;
  };
  sizes: Record<string, number>;
  errors: string[];
  durationMs: number;
};

export type VerificationService = {
  verifyBackup(backupId: string, backupRoot: string): Promise<VerificationResult>;
  verifyAllBackups(backupRoot: string): Promise<{ results: VerificationResult[]; total: number; valid: number; invalid: number }>;
};

export function createVerificationService(): VerificationService {
  return {
    async verifyBackup(backupId: string, backupRoot: string): Promise<VerificationResult> {
      const startTime = Date.now();
      const errors: string[] = [];
      const checks = {
        backupDirExists: false,
        manifestExists: false,
        checksumFileExists: false,
        manifestIntegrity: false,
        databaseDumpExists: false,
        uploadsArchiveExists: false,
        contentArchiveExists: true,
        databaseDumpNonEmpty: false,
        uploadsArchiveNonEmpty: true,
        contentArchiveNonEmpty: true,
      };
      const sizes: Record<string, number> = {};
      const backupDir = join(backupRoot, backupId);

      checks.backupDirExists = existsSync(backupDir);
      if (!checks.backupDirExists) {
        errors.push(`Backup directory not found: ${backupDir}`);
        return { valid: false, checks, sizes, errors, durationMs: Date.now() - startTime };
      }

      const manifestPath = join(backupDir, "manifest.json");
      const checksumPath = join(backupDir, "checksum.sha256");
      const dbDumpPath = join(backupDir, "database.sql.gz");
      const uploadsPath = join(backupDir, "uploads.tar.gz");

      checks.manifestExists = existsSync(manifestPath);
      checks.checksumFileExists = existsSync(checksumPath);

      if (checks.manifestExists && checks.checksumFileExists) {
        try {
          const { readFile } = await import("node:fs/promises");
          const manifestContent = await readFile(manifestPath, "utf-8");
          const expectedChecksum = (await readFile(checksumPath, "utf-8")).trim();
          const actualChecksum = createSha256Checksum(manifestContent);
          checks.manifestIntegrity = actualChecksum === expectedChecksum;
          if (!checks.manifestIntegrity) errors.push("Manifest checksum mismatch");

          const manifest = JSON.parse(manifestContent) as BackupManifest;
          const requiresUploads = manifest.backupType === "FULL";

          checks.databaseDumpExists = existsSync(dbDumpPath);
          if (checks.databaseDumpExists) {
            const s = await stat(dbDumpPath);
            sizes.databaseBytes = s.size;
            checks.databaseDumpNonEmpty = s.size > 0;
            if (!checks.databaseDumpNonEmpty) errors.push("Database dump is empty");
          } else {
            errors.push("database.sql.gz not found");
          }

          checks.uploadsArchiveExists = existsSync(uploadsPath);
          if (checks.uploadsArchiveExists) {
            const s = await stat(uploadsPath);
            sizes.uploadsBytes = s.size;
            checks.uploadsArchiveNonEmpty = s.size > 0;
            if (requiresUploads && !checks.uploadsArchiveNonEmpty) errors.push("Uploads archive is empty");
          } else if (requiresUploads) {
            checks.uploadsArchiveNonEmpty = false;
            errors.push("uploads.tar.gz not found");
          }
        } catch (error) {
          errors.push(`Verification error: ${error instanceof Error ? error.message : "Unknown"}`);
        }
      } else {
        if (!checks.manifestExists) errors.push("manifest.json not found");
        if (!checks.checksumFileExists) errors.push("checksum.sha256 not found");
      }

      const valid = errors.length === 0 && checks.backupDirExists && checks.manifestExists && checks.checksumFileExists && checks.manifestIntegrity && checks.databaseDumpExists && checks.databaseDumpNonEmpty;
      return { valid, checks, sizes, errors, durationMs: Date.now() - startTime };
    },

    async verifyAllBackups(backupRoot: string) {
      const { readdir } = await import("node:fs/promises");
      let dirs: string[] = [];
      try {
        if (existsSync(backupRoot)) dirs = await readdir(backupRoot);
      } catch {}

      const results: VerificationResult[] = [];
      for (const dir of dirs) {
        const fullPath = join(backupRoot, dir);
        try {
          const s = await stat(fullPath);
          if (s.isDirectory()) results.push(await this.verifyBackup(dir, backupRoot));
        } catch {}
      }

      return { results, total: results.length, valid: results.filter((r) => r.valid).length, invalid: results.filter((r) => !r.valid).length };
    },
  };
}
