import { describe, expect, it } from "vitest";

import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";

describe("prisma backup job repository", () => {
  it("persists backup jobs, manifests, completion state and audit events", async () => {
    const calls: string[] = [];
    const prisma = {
      backupJob: {
        async create(args: { data: { type: string; trigger: string } }) {
          calls.push(`job:${args.data.type}:${args.data.trigger}`);
          return { id: "backup_1" };
        },
        async update(args: { where: { id: string }; data: { status: string } }) {
          calls.push(`job-update:${args.where.id}:${args.data.status}`);
          return {};
        },
      },
      backupManifest: {
        async create(args: { data: { backupJobId: string } }) {
          calls.push(`manifest:${args.data.backupJobId}`);
          return {};
        },
      },
      user: { async count() { return 12; } },
      tenant: { async count() { return 10; } },
      site: { async count() { return 10; } },
      mediaAsset: { async count() { return 4; } },
      auditLog: {
        async create(args: { data: { action: string; entityId: string } }) {
          calls.push(`audit:${args.data.action}:${args.data.entityId}`);
          return {};
        },
      },
    };
    const repository = createPrismaBackupJobRepository(prisma);

    await repository.createJob({ type: "DATABASE", trigger: "MANUAL" });
    await expect(repository.collectStats()).resolves.toEqual({
      usersCount: 12,
      tenantsCount: 10,
      sitesCount: 10,
      mediaFilesCount: 4,
    });
    await repository.saveManifest({
      backupJobId: "backup_1",
      backupType: "DATABASE",
      platformVersion: "0.1.0",
      usersCount: 12,
      tenantsCount: 10,
      sitesCount: 10,
      mediaFilesCount: 4,
      compressedSizeBytes: 100,
      compressionAlgorithm: "zstd",
      encryptionEnabled: true,
      sha256Checksum: "checksum",
      localVerificationStatus: "PASSED",
      githubUploadStatus: "PENDING",
      createdAt: new Date("2026-07-06T12:00:00.000Z"),
    });
    await repository.markCompleted({
      backupJobId: "backup_1",
      checksumSha256: "checksum",
      sizeBytes: 100,
      localPath: "backups/2026-07-06/",
      completedAt: new Date("2026-07-06T12:00:00.000Z"),
    });
    await repository.recordAudit({
      action: "BACKUP_COMPLETED",
      entityType: "BackupJob",
      entityId: "backup_1",
    });

    expect(calls).toEqual([
      "job:DATABASE:MANUAL",
      "manifest:backup_1",
      "job-update:backup_1:COMPLETED",
      "audit:BACKUP_COMPLETED:backup_1",
    ]);
  });
});
