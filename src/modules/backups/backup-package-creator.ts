import { cp, mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { createSha256Checksum } from "@/modules/backups/backup-manifest";
import type { BackupManifest } from "@/modules/backups/backup-manifest";

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

function formatBackupId(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}_${h}-${min}`;
}

export function generateBackupId(now?: Date): string {
  return formatBackupId(now ?? new Date());
}

export async function createBackupPackage(
  input: {
    databaseDumpPath: string | null;
    uploadsArchivePath: string | null;
    contentArchivePath: string | null;
    databaseSizeBytes: number;
    uploadsSizeBytes: number;
    contentSizeBytes: number;
    manifest: BackupManifest;
  },
  backupRoot: string,
  now?: Date
): Promise<BackupPackage> {
  const backupId = generateBackupId(now);
  const backupDir = join(backupRoot, backupId);

  await mkdir(backupDir, { recursive: true });

  if (input.databaseDumpPath && existsSync(input.databaseDumpPath)) {
    const dest = join(backupDir, "database.sql.gz");
    await cp(input.databaseDumpPath, dest);
  }
  if (input.uploadsArchivePath && existsSync(input.uploadsArchivePath)) {
    const dest = join(backupDir, "uploads.tar.gz");
    await cp(input.uploadsArchivePath, dest);
  }
  if (input.contentArchivePath && existsSync(input.contentArchivePath)) {
    const dest = join(backupDir, "content.tar.gz");
    await cp(input.contentArchivePath, dest);
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
