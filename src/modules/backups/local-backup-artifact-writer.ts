import { gzip } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import { createSha256Checksum, type BackupType } from "@/modules/backups/backup-manifest";
import type { BackupStats } from "@/modules/backups/backup-job-service";

const gzipAsync = promisify(gzip);

export type BackupArtifact = {
  payloadChecksum: string;
  sizeBytes: number;
  localPath?: string;
  compressionAlgorithm: string;
};

export type BackupArtifactWriter = {
  writeArtifact(input: {
    backupJobId: string;
    type: BackupType;
    stats: BackupStats;
    createdAt: Date;
  }): Promise<BackupArtifact>;
};

export function createInMemoryBackupArtifactWriter(): BackupArtifactWriter {
  return {
    async writeArtifact(input) {
      const payload = createBackupPayload(input);

      return {
        payloadChecksum: createSha256Checksum(payload),
        sizeBytes: Buffer.byteLength(payload),
        compressionAlgorithm: "none"
      };
    }
  };
}

export function createLocalBackupArtifactWriter({
  outputDir = join(process.cwd(), ".frameid-backups")
}: {
  outputDir?: string;
} = {}): BackupArtifactWriter {
  return {
    async writeArtifact(input) {
      const payload = createBackupPayload(input);
      const compressed = await gzipAsync(payload);
      const year = String(input.createdAt.getUTCFullYear());
      const month = String(input.createdAt.getUTCMonth() + 1).padStart(2, "0");
      const localPath = join(
        outputDir,
        year,
        month,
        input.type,
        `${input.backupJobId}.json.gz`
      );

      await mkdir(dirname(localPath), { recursive: true });
      await writeFile(localPath, compressed);

      const written = await readFile(localPath);
      const payloadChecksum = createSha256Checksum(payload);

      if (createSha256Checksum(await gzipAsync(payload)) !== createSha256Checksum(written)) {
        throw new Error("Backup artifact verification failed");
      }

      return {
        payloadChecksum,
        sizeBytes: written.byteLength,
        localPath,
        compressionAlgorithm: "gzip"
      };
    }
  };
}

function createBackupPayload(input: {
  backupJobId: string;
  type: BackupType;
  stats: BackupStats;
  createdAt: Date;
}): string {
  return JSON.stringify({
    backupJobId: input.backupJobId,
    type: input.type,
    stats: input.stats,
    createdAt: input.createdAt.toISOString()
  });
}
