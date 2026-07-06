import { describe, expect, it } from "vitest";

import {
  createBackupManifest,
  createSha256Checksum
} from "@/modules/backups/backup-manifest";

describe("backup manifest", () => {
  it("creates a deterministic checksum for backup payloads", () => {
    expect(createSha256Checksum("frameid-backup")).toHaveLength(64);
    expect(createSha256Checksum("frameid-backup")).toBe(
      createSha256Checksum("frameid-backup")
    );
  });

  it("builds a manifest with platform counts and verification metadata", () => {
    const manifest = createBackupManifest({
      backupJobId: "backup_1",
      type: "DATABASE",
      platformVersion: "0.1.0",
      usersCount: 12,
      tenantsCount: 10,
      sitesCount: 10,
      mediaFilesCount: 20,
      compressedSizeBytes: 1024,
      compressionAlgorithm: "zstd",
      encryptionEnabled: true,
      payloadChecksum: createSha256Checksum("payload"),
      createdAt: new Date("2026-07-06T12:00:00.000Z")
    });

    expect(manifest).toMatchObject({
      backupJobId: "backup_1",
      backupType: "DATABASE",
      platformVersion: "0.1.0",
      localVerificationStatus: "PASSED",
      githubUploadStatus: "PENDING"
    });
  });
});
