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
              nextRunAt: null
            }
          ];
        }
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
              createdAt: new Date("2026-07-06T12:00:00.000Z")
            }
          ];
        }
      }
    };
    const repository = createPrismaAdminBackupCenterRepository(prisma);

    await expect(repository.getBackupCenter()).resolves.toEqual({
      settings: [
        {
          type: "DATABASE",
          enabled: true,
          schedule: "0 2 * * *",
          retentionCount: 14,
          lastRunAt: null,
          nextRunAt: null
        }
      ],
      jobs: [
        {
          id: "backup_1",
          type: "DATABASE",
          status: "COMPLETED",
          trigger: "MANUAL",
          sizeBytes: 1024,
          checksumSha256: "checksum",
          createdAt: "2026-07-06T12:00:00.000Z"
        }
      ]
    });
  });
});
