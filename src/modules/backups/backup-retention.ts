import { existsSync } from "node:fs";
import { rm, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export type RetentionService = {
  cleanup(backupRoot: string, retentionCount: number): Promise<number>;
  countBackups(backupRoot: string): Promise<number>;
};

export function createRetentionService(): RetentionService {
  return {
    async cleanup(
      backupRoot: string,
      retentionCount: number
    ): Promise<number> {
      if (!existsSync(backupRoot)) return 0;

      const entries = await readdir(backupRoot);
      const dirs: { name: string; mtime: Date }[] = [];

      for (const entry of entries) {
        const fullPath = join(backupRoot, entry);
        try {
          const stats = await stat(fullPath);
          if (stats.isDirectory()) {
            dirs.push({ name: entry, mtime: stats.mtime });
          }
        } catch {}
      }

      dirs.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      if (dirs.length <= retentionCount) return 0;

      const toDelete = dirs.slice(retentionCount);
      let deletedCount = 0;

      for (const dir of toDelete) {
        const fullPath = join(backupRoot, dir.name);
        try {
          await rm(fullPath, { recursive: true, force: true });
          deletedCount++;
        } catch {}
      }

      return deletedCount;
    },

    async countBackups(backupRoot: string): Promise<number> {
      if (!existsSync(backupRoot)) return 0;

      const entries = await readdir(backupRoot);
      let count = 0;

      for (const entry of entries) {
        const fullPath = join(backupRoot, entry);
        try {
          const stats = await stat(fullPath);
          if (stats.isDirectory()) count++;
        } catch {}
      }

      return count;
    },
  };
}
