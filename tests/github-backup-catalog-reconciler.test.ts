import { describe, expect, it } from "vitest";

import { addChecksumToManifest, createBackupManifest } from "@/modules/backups/backup-manifest";
import { createGitHubBackupCatalogReconciler, type GitHubCatalogBackupRecord } from "@/modules/backups/github-backup-catalog-reconciler";

function manifest(backupJobId: string, backupType: "DATABASE" | "FULL", createdAt: string) {
  return addChecksumToManifest(createBackupManifest({
    backupJobId,
    backupType,
    appVersion: "1",
    gitCommitSha: "code-sha",
    databaseVersion: "migration",
    usersCount: 3,
    tenantsCount: 3,
    sitesCount: 3,
    mediaFilesCount: 9,
    customerDataCounts: { usersCount: 3, sitesCount: 3 },
    uploadsInventory: [],
    databaseSizeBytes: 100,
    uploadsSizeBytes: backupType === "FULL" ? 50 : 0,
    contentSizeBytes: 0,
    compressionAlgorithm: "gzip",
    encryptionEnabled: false,
    artifactChecksums: { database: "a".repeat(64), uploads: backupType === "FULL" ? "b".repeat(64) : null },
    createdAt,
  }));
}

describe("إعادة بناء فهرس النسخ من GitHub", () => {
  it("يعيد كل Manifests من الفرعين إلى فهرس قابل لإعادة البناء دون تكرار", async () => {
    const records = new Map<string, GitHubCatalogBackupRecord>();
    records.set("stale-job", { backupJobId: "stale-job" } as GitHubCatalogBackupRecord);
    const audits = new Map<string, GitHubCatalogBackupRecord>();
    const source = {
      async listBackupManifests(branch: string) {
        return branch.endsWith("database")
          ? [{ backupId: "db-artifact", commitSha: "db-commit", manifest: manifest("db-job", "DATABASE", "2026-07-13T00:00:00.000Z") }]
          : [{ backupId: "full-artifact", commitSha: "full-commit", manifest: manifest("full-job", "FULL", "2026-07-13T01:00:00.000Z") }];
      },
    };
    const index = {
      async upsertBackup(record: GitHubCatalogBackupRecord) { records.set(record.backupJobId, record); },
      async upsertReindexAudit(record: GitHubCatalogBackupRecord) { audits.set(record.backupJobId, record); },
      async removeMissingBackups(backupJobIds: string[]) {
        for (const id of [...records.keys()]) if (!backupJobIds.includes(id)) records.delete(id);
      },
    };
    const reconciler = createGitHubBackupCatalogReconciler({
      source,
      index,
      repository: "frameid/frameid",
      backupRoot: "/tmp/backups",
    });

    await reconciler.reconcile();
    await reconciler.reconcile();

    expect([...records]).toHaveLength(2);
    expect(records.has("stale-job")).toBe(false);
    expect([...audits]).toHaveLength(2);
    expect(records.get("db-job")).toMatchObject({
      backupId: "db-artifact",
      backupJobId: "db-job",
      type: "DATABASE",
      branch: "frameid-backups-database",
      commitSha: "db-commit",
      githubPath: "https://github.com/frameid/frameid/tree/frameid-backups-database/backups/db-artifact",
      localPath: "/tmp/backups/db-artifact",
      status: "COMPLETED",
    });
    expect(records.get("full-job")?.manifest.backupType).toBe("FULL");
  });

  it("لا يفهرس Manifest تالفة أو موضوعة في فرع نوع آخر", async () => {
    const records: GitHubCatalogBackupRecord[] = [];
    const wrongType = manifest("wrong-job", "FULL", "2026-07-13T00:00:00.000Z");
    const invalid = { ...manifest("invalid-job", "DATABASE", "2026-07-13T00:00:00.000Z"), checksum: "bad" };
    const reconciler = createGitHubBackupCatalogReconciler({
      source: { async listBackupManifests() { return [{ backupId: "wrong", commitSha: "1", manifest: wrongType }, { backupId: "invalid", commitSha: "2", manifest: invalid }]; } },
      index: { async upsertBackup(record) { records.push(record); }, async upsertReindexAudit() {}, async removeMissingBackups() {} },
      repository: "frameid/frameid",
      backupRoot: "/tmp/backups",
    });

    await reconciler.reconcileBranch("DATABASE");

    expect(records).toEqual([]);
  });

  it("لا يحذف السجلات عند فشل مسح كلا الفرعين", async () => {
    const records = new Map<string, GitHubCatalogBackupRecord>();
    records.set("existing-job", { backupJobId: "existing-job" } as GitHubCatalogBackupRecord);
    let deleteCalled = false;
    const reconciler = createGitHubBackupCatalogReconciler({
      source: { async listBackupManifests() { throw new Error("GitHub غير متاح"); } },
      index: {
        async upsertBackup() {},
        async upsertReindexAudit() {},
        async removeMissingBackups() { deleteCalled = true; },
      },
      repository: "frameid/frameid",
      backupRoot: "/tmp/backups",
    });

    const result = await reconciler.reconcile();

    expect(deleteCalled).toBe(false);
    expect(result.skippedCleanup).toBe(true);
    expect(result.indexed).toBe(0);
    expect(records.has("existing-job")).toBe(true);
  });
});
