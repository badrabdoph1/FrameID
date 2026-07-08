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
              trigger: "MANUAL",
              sizeBytes: 1024,
              checksumSha256: "checksum",
              localPath: "backups/2026-07-06/",
              createdAt: new Date("2026-07-06T12:00:00.000Z"),
            },
          ];
        },
      },
      restoreJob: {
        async findMany() {
          return [];
        },
        async count() {
          return 0;
        },
      },
    };
    const repository = createPrismaAdminBackupCenterRepository(prisma);

    const result = await repository.getBackupCenter();
    expect(result.settings).toHaveLength(1);
    expect(result.settings[0].type).toBe("DATABASE");
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("backup_1");
    expect(result.restores).toHaveLength(0);
    expect(result.restoreCount).toBe(0);
  });
});
