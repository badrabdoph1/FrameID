import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { StorageProvider, BackupFile } from "./storage-provider";

export function createLocalStorageProvider(
  backupRoot: string
): StorageProvider {
  return {
    name: "local",

    async upload(input) {
      const destDir = join(backupRoot, input.backupId);
      await mkdir(destDir, { recursive: true });

      for (const file of input.files) {
        await cp(file.path, join(destDir, file.name), {
          recursive: true,
          force: true,
        });
      }

      let totalSize = 0;
      for (const file of input.files) {
        totalSize += file.sizeBytes;
      }

      return {
        url: destDir,
        sizeBytes: totalSize,
      };
    },

    async download(input) {
      const srcDir = join(backupRoot, input.backupId);
      await mkdir(input.destDir, { recursive: true });

      if (existsSync(srcDir)) {
        const entries = await readdir(srcDir);
        for (const entry of entries) {
          await cp(join(srcDir, entry), join(input.destDir, entry), {
            recursive: true,
            force: true,
          });
        }
      }

      return input.destDir;
    },

    async listBackups() {
      if (!existsSync(backupRoot)) return [];

      const entries = await readdir(backupRoot);
      const backups: BackupFile[] = [];

      for (const entry of entries) {
        const fullPath = join(backupRoot, entry);
        try {
          const stats = await stat(fullPath);
          if (stats.isDirectory()) {
            backups.push({
              name: entry,
              path: fullPath,
              sizeBytes: stats.size,
            });
          }
        } catch {}
      }

      return backups.sort((a, b) => b.name.localeCompare(a.name));
    },

    async deleteBackup(backupId: string) {
      const path = join(backupRoot, backupId);
      if (existsSync(path)) {
        await rm(path, { recursive: true, force: true });
      }
    },

    async getBackupSize(backupId: string) {
      const dir = join(backupRoot, backupId);
      if (!existsSync(dir)) return 0;

      let totalSize = 0;
      const entries = await readdir(dir);
      for (const entry of entries) {
        try {
          const stats = await stat(join(dir, entry));
          totalSize += stats.size;
        } catch {}
      }
      return totalSize;
    },
  };
}
