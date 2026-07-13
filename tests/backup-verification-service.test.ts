import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { addChecksumToManifest, createBackupManifest, createFileSha256Checksum, createSha256Checksum } from "@/modules/backups/backup-manifest";
import { createVerificationService } from "@/modules/backups/backup-verification-service";

async function createArtifact(type: "DATABASE" | "FULL") {
  const root = await mkdtemp(join(tmpdir(), "frameid-verification-test-"));
  const backupId = "backup-1";
  const dir = join(root, backupId);
  await mkdir(dir);
  const databasePath = join(dir, "database.sql.gz");
  const uploadsPath = join(dir, "uploads.tar.gz");
  await writeFile(databasePath, "database-payload");
  if (type === "FULL") await writeFile(uploadsPath, "uploads-payload");
  const manifest = addChecksumToManifest(createBackupManifest({
    backupJobId: "job-1", backupType: type, appVersion: "0.1.0", gitCommitSha: "commit",
    databaseVersion: "migration", usersCount: 1, tenantsCount: 1, sitesCount: 1, mediaFilesCount: 1,
    customerDataCounts: { usersCount: 1, tenantsCount: 1, sitesCount: 1, mediaFilesCount: 1 }, uploadsInventory: [],
    databaseSizeBytes: 16, uploadsSizeBytes: type === "FULL" ? 15 : 0, contentSizeBytes: 0,
    compressionAlgorithm: "gzip", encryptionEnabled: false, createdAt: new Date(0).toISOString(),
    artifactChecksums: {
      database: await createFileSha256Checksum(databasePath),
      uploads: type === "FULL" ? await createFileSha256Checksum(uploadsPath) : null,
    },
  }));
  const manifestContent = JSON.stringify(manifest, null, 2);
  await writeFile(join(dir, "manifest.json"), manifestContent);
  await writeFile(join(dir, "checksum.sha256"), createSha256Checksum(manifestContent));
  return { root, backupId, databasePath };
}

describe("تطبيق التحقق الموحد", () => {
  it("يقبل DATABASE سليمة دون اشتراط uploads", async () => {
    const artifact = await createArtifact("DATABASE");
    const result = await createVerificationService({ verifyPayloadTools: false }).verifyBackup(artifact.backupId, artifact.root);
    expect(result.valid).toBe(true);
  });

  it("يرفض تغير محتوى قاعدة البيانات ولو بقي manifest موجودًا", async () => {
    const artifact = await createArtifact("FULL");
    await writeFile(artifact.databasePath, "tampered");
    const result = await createVerificationService({ verifyPayloadTools: false }).verifyBackup(artifact.backupId, artifact.root);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Database artifact checksum mismatch");
  });
});
