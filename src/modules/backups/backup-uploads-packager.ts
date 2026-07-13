import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { BackupFileInventoryItem } from "./backup-manifest";
import { collectUploadsInventory } from "./backup-uploads-inventory";

export type UploadsPackagerResult = {
  archivePath: string;
  sizeBytes: number;
  fileCount: number;
  inventory: BackupFileInventoryItem[];
  durationMs: number;
};

export type UploadsPackager = {
  packageUploads(outputDir: string, backupId: string): Promise<UploadsPackagerResult>;
  getUploadsSize(): Promise<number>;
};

function tarArchive(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("tar", args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

export function createUploadsPackager(uploadsDir: string): UploadsPackager {
  return {
    async packageUploads(outputDir: string): Promise<UploadsPackagerResult> {
      const archivePath = join(outputDir, "uploads.tar.gz");
      await mkdir(dirname(archivePath), { recursive: true });

      const startTime = Date.now();

      const inventory = await collectUploadsInventory(uploadsDir);
      const fileCount = inventory.length;

      if (fileCount > 0) {
        const parentDir = join(uploadsDir, "..");
        const dirName = uploadsDir.split("/").filter(Boolean).pop() ?? "uploads";
        await tarArchive([
          "--exclude=.*",
          "-czf",
          archivePath,
          "-C",
          parentDir,
          dirName,
        ]);
      } else {
        await tarArchive(["-czf", archivePath, "--files-from=/dev/null"]);
      }

      const durationMs = Date.now() - startTime;

      let sizeBytes = 0;
      if (existsSync(archivePath)) {
        const stats = await stat(archivePath);
        sizeBytes = stats.size;
      }

      return { archivePath, sizeBytes, fileCount, inventory, durationMs };
    },

    async getUploadsSize(): Promise<number> {
      if (!existsSync(uploadsDir)) return 0;

      let totalSize = 0;
      const files = await readdir(uploadsDir, { recursive: true });
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = join(uploadsDir, file);
        const stats = await stat(filePath);
        if (stats.isFile()) totalSize += stats.size;
      }
      return totalSize;
    },
  };
}
