import { existsSync } from "node:fs";
import { rm, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { BackupType } from "@/modules/backups/backup-manifest";

export type RetentionService = {
  cleanup(backupRoot: string, retentionCount: number): Promise<number>;
  cleanupByType(backupRoot: string, backupType: BackupType, retentionCount: number): Promise<number>;
  countBackups(backupRoot: string): Promise<number>;
};

type BackupDir = {
  name: string;
  path: string;
  mtime: Date;
  backupType: string | null;
  valid: boolean;
};

async function listBackupDirectories(backupRoot: string): Promise<BackupDir[]> {
  if (!existsSync(backupRoot)) return [];

  const entries = await readdir(backupRoot);
  const dirs: BackupDir[] = [];

  for (const entry of entries) {
    const fullPath = join(backupRoot, entry);
    try {
      const stats = await stat(fullPath);
      if (!stats.isDirectory()) continue;

      let backupType: string | null = null;
      let valid = false;
      try {
        const raw = await readFile(join(fullPath, "manifest.json"), "utf-8");
        const manifest = JSON.parse(raw) as { backupType?: string; checksum?: string };
        backupType = manifest.backupType ?? null;
        valid = typeof manifest.checksum === "string" && manifest.checksum.length === 64;
      } catch {
        valid = false;
      }

      dirs.push({ name: entry, path: fullPath, mtime: stats.mtime, backupType, valid });
    } catch {}
  }

  return dirs.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

async function removeDirs(dirs: BackupDir[]): Promise<number> {
  let deletedCount = 0;
  for (const dir of dirs) {
    try {
      await rm(dir.path, { recursive: true, force: true });
      deletedCount++;
    } catch {}
  }
  return deletedCount;
}

export function createRetentionService(): RetentionService {
  return {
    async cleanup(backupRoot: string, retentionCount: number): Promise<number> {
      const dirs = await listBackupDirectories(backupRoot);
      if (dirs.length <= retentionCount) return 0;
      return removeDirs(dirs.slice(retentionCount));
    },

    async cleanupByType(backupRoot: string, backupType: BackupType, retentionCount: number): Promise<number> {
      const dirs = (await listBackupDirectories(backupRoot)).filter((dir) => dir.backupType === backupType);
      const validDirs = dirs.filter((dir) => dir.valid);

      if (validDirs.length <= retentionCount) return 0;

      const keepValid = new Set(validDirs.slice(0, retentionCount).map((dir) => dir.name));
      const latestValidName = validDirs[0]?.name;
      const candidates = validDirs.filter((dir) => dir.name !== latestValidName && !keepValid.has(dir.name));

      return removeDirs(candidates);
    },

    async countBackups(backupRoot: string): Promise<number> {
      return listBackupDirectories(backupRoot).then((dirs) => dirs.length);
    },
  };
}
