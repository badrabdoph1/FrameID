import { describe, expect, it } from "vitest";

import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";

describe("admin backup center repository", () => {
  it("loads backup settings and recent jobs", async () => {
    const prisma = {
      backupSettings: {
        async findMany() {
          return [
            {
              type: "DATABASE",
              enabled: true,
              schedule: "0 2 * * *",
              retentionCount: 14,
              lastRunAt: null,
              nextRunAt: null,
            },
          ];
        },
      },
      backupJob: {
        async findMany() {
          return [
            {
              id: "backup_1",
              type: "DATABASE",
              status: "COMPLETED",
              sizeBytes: 1024,
              checksumSha256: "checksum",
              filePath: "backups/2026-07-06/",
              errorMessage: null,
              metadata: {
                trigger: "MANUAL",
                githubPath: "https://github.com/frameid/frameid/tree/frameid-backups-database/backups/2026-07-06_12-00",
                githubBranch: "frameid-backups-database",
                githubCommitSha: "abc123",
                localVerified: true,
                githubUploaded: true,
                remoteVerified: true,
                retentionApplied: true,
                auditLogged: true,
              },
              createdAt: new Date("2026-07-06T12:00:00.000Z"),
              completedAt: new Date("2026-07-06T12:00:03.000Z"),
            },
          ];
        },
      },
      restoreJob: {
        async findMany() {
          return [{
            id: "restore_1",
            backupJobId: "2026-07-13_00-35",
            status: "COMPLETED",
            targetDatabase: "GITHUB:FULL",
            errorMessage: null,
            createdAt: new Date("2026-07-13T00:47:00.000Z"),
            completedAt: new Date("2026-07-13T00:47:03.000Z"),
          }];
        },
        async count() {
          return 1;
        },
      },
    };
    const repository = createPrismaAdminBackupCenterRepository(prisma);

    const result = await repository.getBackupCenter();
    expect(result.settings).toHaveLength(1);
    expect(result.settings[0].type).toBe("DATABASE");
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("backup_1");
    expect(result.jobs[0]).toMatchObject({
      trigger: "MANUAL",
      githubBranch: "frameid-backups-database",
      githubCommitSha: "abc123",
      githubPath: "https://github.com/frameid/frameid/tree/frameid-backups-database/backups/2026-07-06_12-00",
      localVerified: true,
      githubUploaded: true,
      remoteVerified: true,
      retentionApplied: true,
      auditLogged: true,
    });
    expect(result.restores).toHaveLength(1);
    expect(result.restores[0]).toMatchObject({ type: "FULL", source: "GITHUB" });
    expect(result.restoreCount).toBe(1);
  });
});
