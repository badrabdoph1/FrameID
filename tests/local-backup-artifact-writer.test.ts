import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { createLocalBackupArtifactWriter } from "@/modules/backups/local-backup-artifact-writer";

const unzip = promisify(gunzip);

describe("local backup artifact writer", () => {
  it("writes a compressed verified artifact to a dated backup folder", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "frameid-backups-"));
    const writer = createLocalBackupArtifactWriter({ outputDir });

    const artifact = await writer.writeArtifact({
      backupJobId: "backup_1",
      type: "DATABASE",
      stats: {
        usersCount: 1,
        tenantsCount: 1,
        sitesCount: 1,
        mediaFilesCount: 0
      },
      createdAt: new Date("2026-07-06T12:00:00.000Z")
    });

    expect(artifact.localPath).toContain("2026/07/DATABASE/backup_1.json.gz");
    expect(artifact.sizeBytes).toBeGreaterThan(0);
    expect(artifact.payloadChecksum).toHaveLength(64);
    expect(artifact.compressionAlgorithm).toBe("gzip");
    expect(artifact.localPath).toBeDefined();

    const compressed = await readFile(artifact.localPath as string);
    const payload = JSON.parse((await unzip(compressed)).toString("utf8")) as {
      backupJobId: string;
    };

    expect(payload.backupJobId).toBe("backup_1");
  });
});
