import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";

const execAsync = promisify(exec);

export type ContentPackagerResult = {
  archivePath: string;
  sizeBytes: number;
  fileCount: number;
  durationMs: number;
};

export type ContentPackager = {
  packageContent(outputDir: string, backupId: string): Promise<ContentPackagerResult>;
  getContentSize(): Promise<number>;
};

export function createContentPackager(contentDir: string): ContentPackager {
  return {
    async packageContent(
      outputDir: string,
      _backupId: string
    ): Promise<ContentPackagerResult> {
      const archivePath = join(outputDir, "content.tar.gz");
      await mkdir(dirname(archivePath), { recursive: true });

      const startTime = Date.now();

      let fileCount = 0;
      if (existsSync(contentDir)) {
        const files = await readdir(contentDir, { recursive: true });
        fileCount = files.filter((f) => !f.startsWith(".")).length;
      }

      if (fileCount > 0) {
        await execAsync(
          `tar --exclude=".backups" --exclude=".*" -czf "${archivePath}" -C "${contentDir}/.." "${contentDir.split("/").pop()}"`,
          { maxBuffer: 1024 * 1024 * 1024 }
        );
      } else {
        await execAsync(
          `tar -czf "${archivePath}" --files-from=/dev/null`,
          { maxBuffer: 1024 * 1024 }
        );
      }

      const durationMs = Date.now() - startTime;

      let sizeBytes = 0;
      if (existsSync(archivePath)) {
        const stats = await stat(archivePath);
        sizeBytes = stats.size;
      }

      return { archivePath, sizeBytes, fileCount, durationMs };
    },

    async getContentSize(): Promise<number> {
      if (!existsSync(contentDir)) return 0;

      let totalSize = 0;
      const files = await readdir(contentDir, { recursive: true });
      for (const file of files) {
        if (file.startsWith(".") || file.startsWith(".backups")) continue;
        const filePath = join(contentDir, file);
        try {
          const stats = await stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        } catch {}
      }
      return totalSize;
    },
  };
}
