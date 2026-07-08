import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";

const execAsync = promisify(exec);

export type UploadsPackagerResult = {
  archivePath: string;
  sizeBytes: number;
  fileCount: number;
  durationMs: number;
};

export type UploadsPackager = {
  packageUploads(outputDir: string, backupId: string): Promise<UploadsPackagerResult>;
  getUploadsSize(): Promise<number>;
};

export function createUploadsPackager(uploadsDir: string): UploadsPackager {
  return {
    async packageUploads(
      outputDir: string,
      _backupId: string
    ): Promise<UploadsPackagerResult> {
      const archivePath = join(outputDir, "uploads.tar.gz");
      await mkdir(dirname(archivePath), { recursive: true });

      const startTime = Date.now();

      let fileCount = 0;
      if (existsSync(uploadsDir)) {
        const files = await readdir(uploadsDir, { recursive: true });
        fileCount = files.filter((f) => !f.startsWith(".")).length;
      }

      if (fileCount > 0) {
        await execAsync(
          `tar --exclude=".*" -czf "${archivePath}" -C "${uploadsDir}/.." "${uploadsDir.split("/").pop()}"`,
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

    async getUploadsSize(): Promise<number> {
      if (!existsSync(uploadsDir)) return 0;

      let totalSize = 0;
      const files = await readdir(uploadsDir, { recursive: true });
      for (const file of files) {
        const filePath = join(uploadsDir, file);
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
