import { describe, expect, it } from "vitest";

import {
  createBackupManifest,
  addChecksumToManifest,
  createSha256Checksum,
  validateBackupManifest,
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
      backupType: "DATABASE",
      appVersion: "0.1.0",
      gitCommitSha: "abc123",
      databaseVersion: "20260708050000",
      usersCount: 12,
      tenantsCount: 10,
      sitesCount: 10,
      mediaFilesCount: 20,
      customerDataCounts: { usersCount: 12, tenantsCount: 10, subscriptionsCount: 4 },
      uploadsInventory: [],
      databaseSizeBytes: 1024,
      uploadsSizeBytes: 0,
      contentSizeBytes: 0,
      compressionAlgorithm: "gzip",
      encryptionEnabled: true,
      artifactChecksums: { database: "d".repeat(64), uploads: null },
      createdAt: "2026-07-06T12:00:00.000Z",
    });

    const completeManifest = addChecksumToManifest(manifest);

    expect(completeManifest.version).toBe(2);
    expect(completeManifest.schemaVersion).toBe(2);
    expect(completeManifest.backupType).toBe("DATABASE");
    expect(completeManifest.totalSizeBytes).toBe(1024);
    expect(completeManifest.checksum).toHaveLength(64);
    expect(completeManifest.files.database).toBe("database.sql.gz");
    expect(completeManifest.files.manifest).toBe("manifest.json");
  });

  it("validates a correctly formed manifest", () => {
    const manifest = addChecksumToManifest(
      createBackupManifest({
        backupJobId: "backup_1",
        backupType: "FULL",
        appVersion: "0.1.0",
        gitCommitSha: "abc123",
        databaseVersion: "20260708050000",
        usersCount: 12,
        tenantsCount: 10,
        sitesCount: 10,
        mediaFilesCount: 20,
        customerDataCounts: { usersCount: 12, tenantsCount: 10, subscriptionsCount: 4, paymentRequestsCount: 2 },
        uploadsInventory: [{ path: "tenant/document.pdf", sizeBytes: 2048, sha256: "f".repeat(64) }],
        databaseSizeBytes: 1024,
        uploadsSizeBytes: 2048,
        contentSizeBytes: 512,
        compressionAlgorithm: "gzip",
        encryptionEnabled: false,
        artifactChecksums: { database: "d".repeat(64), uploads: "u".repeat(64) },
        createdAt: "2026-07-06T12:00:00.000Z",
      })
    );

    const result = validateBackupManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.checks.manifestValid).toBe(true);
    expect(result.checks.schemaCompatibility).toBe(true);
    expect(result.checks.filesIntegrity).toBe(true);
  });

  it("rejects an invalid manifest", () => {
    const result = validateBackupManifest(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
