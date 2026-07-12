import { describe, expect, it } from "vitest";

import {
  createBackupJobService,
  type BackupJobRepository,
} from "@/modules/backups/backup-job-service";

function createRepository(): BackupJobRepository & { events: string[] } {
  const events: string[] = [];

  return {
    events,
    async createJob(input) {
      events.push(`job:${input.type}:${input.trigger}`);
      return { id: "backup_1" };
    },
    async collectStats() {
      events.push("stats");
      return {
        usersCount: 12,
        tenantsCount: 10,
        sitesCount: 10,
        mediaFilesCount: 4,
      };
    },
    async saveManifest(input) {
      events.push(`manifest:${(input as { backupJobId: string }).backupJobId}`);
    },
    async markCompleted(input) {
      events.push(
        `completed:${input.backupJobId}:${input.checksumSha256}`
      );
    },
    async markFailed(input) {
      events.push(`failed:${input.backupJobId}:${input.reason}`);
    },
    async recordAudit(input) {
      events.push(`audit:${input.action}:${input.entityId}`);
    },
  };
}

describe("backup job service", () => {
  it("creates a backup job and processes it through the lifecycle", async () => {
    const repository = createRepository();
    const service = createBackupJobService({
      repository,
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      platformVersion: "0.1.0",
      backupGitHubToken: "ghp_fake_token_for_testing",
      now: () => new Date("2026-07-06T12:00:00.000Z"),
    });

    const result = await service.runManualBackup({
      type: "DATABASE",
      initiatedById: "admin_1",
      note: "Before release",
    });

    expect(result.backupJobId).toBe("backup_1");
    expect(result.status).toBe("COMPLETED");
    expect(result.backupId).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);

    expect(repository.events[0]).toBe("job:DATABASE:MANUAL");
    expect(repository.events[1]).toBe("audit:BACKUP_STARTED:backup_1");
    expect(repository.events[repository.events.length - 1]).toBe(
      "audit:BACKUP_COMPLETED:backup_1"
    );
  });

  it("marks a backup as failed when artifact writing fails", async () => {
    const repository = createRepository();
    const failingRepo: BackupJobRepository = {
      ...repository,
      async collectStats() {
        throw new Error("Database connection failed");
      },
    };

    const service = createBackupJobService({
      repository: failingRepo,
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      platformVersion: "0.1.0",
      backupGitHubToken: "ghp_fake_token_for_testing",
    });

    await expect(
      service.runManualBackup({
        type: "DATABASE",
        initiatedById: "admin_1",
      })
    ).rejects.toThrow("Database connection failed");
  });
});
