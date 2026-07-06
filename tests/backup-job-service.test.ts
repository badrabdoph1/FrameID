import { describe, expect, it } from "vitest";

import {
  createBackupJobService,
  type BackupJobRepository
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
        mediaFilesCount: 4
      };
    },
    async saveManifest(input) {
      events.push(`manifest:${input.backupJobId}`);
    },
    async markCompleted(input) {
      events.push(`completed:${input.backupJobId}:${input.checksumSha256}`);
    },
    async markFailed(input) {
      events.push(`failed:${input.backupJobId}:${input.reason}`);
    },
    async recordAudit(input) {
      events.push(`audit:${input.action}:${input.entityId}`);
    }
  };
}

describe("backup job service", () => {
  it("creates and verifies a database backup job before marking it completed", async () => {
    const repository = createRepository();
    const service = createBackupJobService({
      repository,
      platformVersion: "0.1.0",
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await expect(
      service.runManualBackup({
        type: "DATABASE",
        initiatedById: "admin_1",
        note: "Before release"
      })
    ).resolves.toEqual({
      backupJobId: "backup_1",
      status: "COMPLETED"
    });

    expect(repository.events).toEqual([
      "job:DATABASE:MANUAL",
      "audit:BACKUP_STARTED:backup_1",
      "stats",
      "manifest:backup_1",
      "completed:backup_1:3e19252afad1968ca935ea6a75082b08e074ee59f0dc5ceabe6eadf7ae1635b2",
      "audit:BACKUP_COMPLETED:backup_1"
    ]);
  });
});
