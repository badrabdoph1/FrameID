import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { createLocalBackupArtifactWriter, generateBackupId } from "@/modules/backups/local-backup-artifact-writer";

describe("local backup artifact writer", () => {
  it("writes a manifest and checksum to a dated backup folder", async () => {
    const backupRoot = await mkdtemp(join(tmpdir(), "frameid-backups-"));
    const writer = createLocalBackupArtifactWriter({ backupRoot });

    const backupId = generateBackupId(new Date("2026-07-06T12:00:00.000Z"));
    expect(backupId).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);

    const result = await writer.writeBackup({
      backupId,
      type: "DATABASE",
      databaseDumpPath: "/tmp/test-dump.sql.gz",
      uploadsArchivePath: null,
      contentArchivePath: null,
      databaseSizeBytes: 1024,
      uploadsSizeBytes: 0,
      contentSizeBytes: 0,
      manifest: {
        version: 1,
        schemaVersion: 1,
        backupJobId: backupId,
        backupType: "DATABASE",
        createdAt: "2026-07-06T12:00:00.000Z",
        appVersion: "0.1.0",
        gitCommitSha: "",
        databaseVersion: "1.0",
        usersCount: 0,
        tenantsCount: 0,
        sitesCount: 0,
        mediaFilesCount: 0,
        databaseSizeBytes: 1024,
        uploadsSizeBytes: 0,
        contentSizeBytes: 0,
        totalSizeBytes: 1024,
        compressionAlgorithm: "gzip",
        encryptionEnabled: false,
        files: {
          database: "database.sql.gz",
          uploads: "uploads.tar.gz",
          content: "content.tar.gz",
          manifest: "manifest.json",
          checksum: "checksum.sha256",
        },
        checksum: "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
      },
      checksumSha256:
        "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
    });

    expect(result.backupDir).toContain(backupId);
    expect(result.manifestPath).toContain("manifest.json");

    const manifestContent = await readFile(result.manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent);
    expect(manifest.version).toBe(1);
    expect(manifest.backupJobId).toBe(backupId);
  });
});
