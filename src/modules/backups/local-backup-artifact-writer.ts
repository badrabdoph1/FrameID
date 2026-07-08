import { mkdir, writeFile, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

import type { BackupType, BackupManifest } from "@/modules/backups/backup-manifest";
import { generateBackupId } from "@/modules/backups/backup-package-creator";

export type BackupArtifact = {
  backupDir: string;
  backupId: string;
  databaseDumpPath: string;
  uploadsArchivePath: string | null;
  contentArchivePath: string | null;
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  totalSizeBytes: number;
  payloadChecksum: string;
  compressionAlgorithm: string;
};

export type BackupArtifactWriter = {
  writeBackup(input: {
    backupId: string;
    type: BackupType;
    databaseDumpPath: string;
    uploadsArchivePath: string | null;
    contentArchivePath: string | null;
    databaseSizeBytes: number;
    uploadsSizeBytes: number;
    contentSizeBytes: number;
    manifest: BackupManifest;
    checksumSha256: string;
  }): Promise<{ backupDir: string; manifestPath: string }>;
};

export function createLocalBackupArtifactWriter({
  backupRoot = join(process.cwd(), "backups"),
}: {
  backupRoot?: string;
} = {}): BackupArtifactWriter {
  return {
    async writeBackup(input) {
      const backupDir = join(backupRoot, input.backupId);
      await mkdir(backupDir, { recursive: true });

      const manifestPath = join(backupDir, "manifest.json");
      await writeFile(
        manifestPath,
        JSON.stringify(input.manifest, null, 2)
      );

      const checksumPath = join(backupDir, "checksum.sha256");
      await writeFile(checksumPath, input.checksumSha256);

      return { backupDir, manifestPath };
    },
  };
}

export { generateBackupId };

export async function listBackupDirs(backupRoot?: string): Promise<string[]> {
  const root = backupRoot ?? join(process.cwd(), "backups");
  if (!existsSync(root)) return [];

  const entries = await readdir(root);
  const dirs: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry);
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        dirs.push(entry);
      }
    } catch {}
  }

  return dirs.sort().reverse();
}

export async function readBackupManifest(
  backupId: string,
  backupRoot?: string
): Promise<Record<string, unknown> | null> {
  const root = backupRoot ?? join(process.cwd(), "backups");
  const manifestPath = join(root, backupId, "manifest.json");

  if (!existsSync(manifestPath)) return null;

  try {
    const content = await readFile(manifestPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
