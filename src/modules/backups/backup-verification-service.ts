import { stat } from "node:fs/promises";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

import { createFileSha256Checksum, createSha256Checksum, validateBackupManifest, type BackupManifest } from "./backup-manifest";
import { restoreUploadsArchive } from "./backup-uploads-archive";
import { validateUploadsInventory } from "./backup-uploads-inventory";

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

async function runCommand(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `${command} exited with ${code}`)));
  });
}

async function verifyPostgresDump(path: string): Promise<void> {
  const tempRoot = await mkdtemp(join(tmpdir(), "frameid-backup-verify-"));
  const dumpPath = join(tempRoot, "database.dump");
  try {
    await pipeline(createReadStream(path), createGunzip(), createWriteStream(dumpPath));
    await runCommand("pg_restore", ["--list", dumpPath]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

export function createVerificationService({ verifyPayloadTools = true }: { verifyPayloadTools?: boolean } = {}): VerificationService {
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
          const manifestValidation = validateBackupManifest(manifest);
          if (!manifestValidation.valid) errors.push(...manifestValidation.errors);
          const requiresUploads = manifest.backupType === "FULL";

          checks.databaseDumpExists = existsSync(dbDumpPath);
          if (checks.databaseDumpExists) {
            const s = await stat(dbDumpPath);
            sizes.databaseBytes = s.size;
            checks.databaseDumpNonEmpty = s.size > 0;
            if (!checks.databaseDumpNonEmpty) errors.push("Database dump is empty");
            if (checks.databaseDumpNonEmpty) {
              const checksum = await createFileSha256Checksum(dbDumpPath);
              if (checksum !== manifest.artifactChecksums?.database) errors.push("Database artifact checksum mismatch");
              if (verifyPayloadTools) {
                try { await verifyPostgresDump(dbDumpPath); }
                catch (error) { errors.push(error instanceof Error ? error.message : "Invalid PostgreSQL dump"); }
              }
            }
          } else {
            errors.push("database.sql.gz not found");
          }

          checks.uploadsArchiveExists = existsSync(uploadsPath);
          if (checks.uploadsArchiveExists) {
            const s = await stat(uploadsPath);
            sizes.uploadsBytes = s.size;
            checks.uploadsArchiveNonEmpty = s.size > 0;
            if (requiresUploads && !checks.uploadsArchiveNonEmpty) errors.push("Uploads archive is empty");
            if (requiresUploads && checks.uploadsArchiveNonEmpty) {
              const checksum = await createFileSha256Checksum(uploadsPath);
              if (checksum !== manifest.artifactChecksums?.uploads) errors.push("Uploads artifact checksum mismatch");
              if (verifyPayloadTools) {
                const extracted = await mkdtemp(join(tmpdir(), "frameid-uploads-verify-"));
                try {
                  await restoreUploadsArchive(uploadsPath, extracted);
                  const inventory = await validateUploadsInventory(extracted, manifest.uploadsInventory ?? []);
                  if (!inventory.valid) errors.push(...inventory.errors);
                } catch (error) {
                  errors.push(error instanceof Error ? error.message : "Invalid uploads archive");
                } finally {
                  await rm(extracted, { recursive: true, force: true });
                }
              }
            }
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
