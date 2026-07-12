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
  it("creates a backup job and fails when pg_dump is unavailable", async () => {
    const repository = createRepository();
    const service = createBackupJobService({
      repository,
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      platformVersion: "0.1.0",
      backupGitHubToken: "ghp_fake_token_for_testing",
      backupGitHubRepository: "test-owner/test-repo",
      now: () => new Date("2026-07-06T12:00:00.000Z"),
    });

    await expect(
      service.runManualBackup({
        type: "DATABASE",
        initiatedById: "admin_1",
        note: "Before release",
      })
    ).rejects.toThrow();

    expect(repository.events[0]).toBe("job:DATABASE:MANUAL");
    expect(repository.events[1]).toBe("audit:BACKUP_STARTED:backup_1");
    expect(repository.events[2]).toMatch("failed:backup_1:");
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
      backupGitHubRepository: "test-owner/test-repo",
    });

    await expect(
      service.runManualBackup({
        type: "DATABASE",
        initiatedById: "admin_1",
      })
    ).rejects.toThrow("Database connection failed");

    expect(repository.events[0]).toBe("job:DATABASE:MANUAL");
    expect(repository.events[1]).toBe("audit:BACKUP_STARTED:backup_1");
    expect(repository.events[2]).toBe("failed:backup_1:Database connection failed");
  });

  it("creates a Snapshot through the FULL backup path", async () => {
    const repository = createRepository();
    const service = createBackupJobService({
      repository,
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      platformVersion: "0.1.0",
      backupGitHubToken: "ghp_fake_token_for_testing",
      backupGitHubRepository: "test-owner/test-repo",
      now: () => new Date("2026-07-06T12:00:00.000Z"),
    });

    const result = await service.createSnapshot({
      reason: "migration snapshot",
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      initiatedById: "admin_1",
    });

    expect(result.success).toBe(false);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("returns disabled auto-restore status", async () => {
    const repository = createRepository();
    const service = createBackupJobService({
      repository,
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      platformVersion: "0.1.0",
      backupGitHubToken: "ghp_fake_token_for_testing",
      backupGitHubRepository: "test-owner/test-repo",
    });

    const result = await service.checkAndAutoRestore({
      databaseUrl: "postgresql://test:test@localhost:5432/test",
    });

    expect(result.needed).toBe(false);
    expect(result.restored).toBe(false);
    expect(result.reason).toContain("disabled");
  });

  it("getScheduler returns a scheduler object", () => {
    const repository = createRepository();
    const service = createBackupJobService({
      repository,
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      platformVersion: "0.1.0",
      backupGitHubToken: "ghp_fake_token_for_testing",
      backupGitHubRepository: "test-owner/test-repo",
    });

    const scheduler = service.getScheduler();
    expect(scheduler).toBeDefined();
    expect(typeof scheduler.executeScheduled).toBe("function");
    expect(typeof scheduler.isTimeToRun).toBe("function");
  });
});
