import { describe, expect, it } from "vitest";

import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";

describe("prisma backup job repository", () => {
  it("persists backup jobs, completion state and audit events", async () => {
    const calls: string[] = [];
    const prisma = {
      backupJob: {
        async create(args: { data: { type: string; metadata?: Record<string, unknown> } }) {
          const trigger = args.data.metadata && typeof args.data.metadata === 'object' && 'trigger' in args.data.metadata
            ? (args.data.metadata as Record<string, unknown>).trigger
            : "unknown";
          calls.push(`job:${args.data.type}:${trigger}`);
          return { id: "backup_1" };
        },
        async update(args: { where: { id: string }; data: { status: string } }) {
          calls.push(`job-update:${args.where.id}:${args.data.status}`);
          return {};
        },
      },
      async $queryRawUnsafe<T>(query: string): Promise<T> {
        let count = 0n;
        if (query.includes('"User"')) count = 12n;
        else if (query.includes('"Tenant"')) count = 10n;
        else if (query.includes('FROM "Site"')) count = 10n;
        else if (query.includes('"MediaAsset"')) count = 4n;
        else if (query.includes('FROM "Subscription"')) count = 3n;
        else if (query.includes('FROM "PaymentRequest"')) count = 2n;
        return [{ count }] as T;
      },
      auditLog: {
        async create(args: { data: { action: string; entityId: string } }) {
          calls.push(`audit:${args.data.action}:${args.data.entityId}`);
          return {};
        },
      },
    };
    const repository = createPrismaBackupJobRepository(prisma);

    await repository.createJob({ type: "DATABASE", trigger: "MANUAL" });
    await expect(repository.collectStats()).resolves.toMatchObject({
      usersCount: 12,
      tenantsCount: 10,
      sitesCount: 10,
      mediaFilesCount: 4,
      customerDataCounts: {
        usersCount: 12,
        tenantsCount: 10,
        sitesCount: 10,
        mediaFilesCount: 4,
        subscriptionsCount: 3,
        paymentRequestsCount: 2,
      },
    });
    await repository.saveManifest({
      version: 2,
      schemaVersion: 2,
      backupJobId: "backup_1",
      backupType: "DATABASE",
      appVersion: "0.1.0",
      createdAt: "2026-07-06T12:00:00.000Z",
      gitCommitSha: "abc123",
      databaseVersion: "1.0",
      usersCount: 12,
      tenantsCount: 10,
      sitesCount: 10,
      mediaFilesCount: 4,
      customerDataCounts: { usersCount: 12, tenantsCount: 10, sitesCount: 10, mediaFilesCount: 4 },
      uploadsInventory: [],
      databaseSizeBytes: 0,
      uploadsSizeBytes: 0,
      contentSizeBytes: 0,
      totalSizeBytes: 100,
      compressionAlgorithm: "zstd",
      encryptionEnabled: true,
      artifactChecksums: { database: "d".repeat(64), uploads: null },
      files: {
        database: "database.sql.gz",
        uploads: "uploads.tar.gz",
        content: null,
        manifest: "manifest.json",
        checksum: "checksum.sha256",
      },
      checksum: "checksum",
    });
    await repository.markCompleted({
      backupJobId: "backup_1",
      checksumSha256: "checksum",
      sizeBytes: 100,
      localPath: "backups/2026-07-06/",
      githubPath: "https://github.com/example/repo/tree/backups/id",
      githubBranch: "frameid-backups-database",
      githubCommitSha: "abc123",
      completedAt: new Date("2026-07-06T12:00:00.000Z"),
    });
    await repository.recordAudit({
      action: "BACKUP_COMPLETED",
      entityType: "BackupJob",
      entityId: "backup_1",
    });

    expect(calls).toEqual([
      "job:DATABASE:MANUAL",
      "job-update:backup_1:COMPLETED",
      "audit:BACKUP_COMPLETED:backup_1",
    ]);
  });
});
