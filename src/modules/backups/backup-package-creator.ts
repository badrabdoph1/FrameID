import { join } from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";

import { createSha256Checksum } from "@/modules/backups/backup-manifest";
import { generateBackupId } from "@/modules/backups/local-backup-artifact-writer";

export type BackupPackage = {
  backupId: string;
  backupDir: string;
  databaseDumpPath: string | null;
  uploadsArchivePath: string | null;
  contentArchivePath: string | null;
  manifestPath: string;
  checksumPath: string;
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  totalSizeBytes: number;
  checksumSha256: string;
};

export async function createBackupPackage(
  input: {
    databaseDumpPath: string | null;
    uploadsArchivePath: string | null;
    contentArchivePath: string | null;
    databaseSizeBytes: number;
    uploadsSizeBytes: number;
    contentSizeBytes: number;
    manifest: Record<string, unknown>;
  },
  backupRoot: string,
  now?: Date
): Promise<BackupPackage> {
  const backupId = generateBackupId(now);
  const backupDir = join(backupRoot, backupId);

  await mkdir(backupDir, { recursive: true });

  if (input.databaseDumpPath && existsSync(input.databaseDumpPath)) {
    const dest = join(backupDir, "database.sql.gz");
    execSync(`cp "${input.databaseDumpPath}" "${dest}"`, {
      stdio: "pipe",
    });
  }
  if (input.uploadsArchivePath && existsSync(input.uploadsArchivePath)) {
    const dest = join(backupDir, "uploads.tar.gz");
    execSync(`cp "${input.uploadsArchivePath}" "${dest}"`, {
      stdio: "pipe",
    });
  }
  if (input.contentArchivePath && existsSync(input.contentArchivePath)) {
    const dest = join(backupDir, "content.tar.gz");
    execSync(`cp "${input.contentArchivePath}" "${dest}"`, {
      stdio: "pipe",
    });
  }

  const manifestPath = join(backupDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(input.manifest, null, 2));

  const manifestContent = await readFile(manifestPath, "utf-8");
  const checksumSha256 = createSha256Checksum(manifestContent);

  const checksumPath = join(backupDir, "checksum.sha256");
  await writeFile(checksumPath, checksumSha256);

  const totalSizeBytes =
    input.databaseSizeBytes + input.uploadsSizeBytes + input.contentSizeBytes;

  return {
    backupId,
    backupDir,
    databaseDumpPath: input.databaseDumpPath ? join(backupDir, "database.sql.gz") : null,
    uploadsArchivePath: input.uploadsArchivePath ? join(backupDir, "uploads.tar.gz") : null,
    contentArchivePath: input.contentArchivePath ? join(backupDir, "content.tar.gz") : null,
    manifestPath,
    checksumPath,
    databaseSizeBytes: input.databaseSizeBytes,
    uploadsSizeBytes: input.uploadsSizeBytes,
    contentSizeBytes: input.contentSizeBytes,
    totalSizeBytes,
    checksumSha256,
  };
}
