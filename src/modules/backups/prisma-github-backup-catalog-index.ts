import type { GitHubCatalogBackupRecord } from "./github-backup-catalog-reconciler";

type CatalogPrismaClient = {
  backupJob: {
    findUnique(input: unknown): Promise<{ metadata: unknown } | null>;
    upsert(input: unknown): Promise<unknown>;
    deleteMany(input: unknown): Promise<unknown>;
  };
  auditLog: { upsert(input: unknown): Promise<unknown> };
};

function metadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function createPrismaGitHubBackupCatalogIndex(prisma: CatalogPrismaClient) {
  return {
    async upsertBackup(record: GitHubCatalogBackupRecord) {
      const existing = await prisma.backupJob.findUnique({ where: { id: record.backupJobId }, select: { metadata: true } });
      const existingMetadata = metadata(existing?.metadata);
      const restoredMetadata = {
        ...existingMetadata,
        trigger: existingMetadata.trigger ?? "GITHUB_REINDEX",
        initiatedBy: existingMetadata.initiatedBy ?? "github-catalog",
        artifactId: record.backupId,
        githubPath: record.githubPath,
        githubBranch: record.branch,
        githubCommitSha: record.commitSha,
        externalStorage: "github",
        localVerified: true,
        githubUploaded: true,
        remoteVerified: true,
        retentionApplied: true,
        auditLogged: true,
        reindexedFromGitHub: true,
      };
      const createdAt = new Date(record.manifest.createdAt);
      const data = {
        type: record.type,
        status: record.status,
        filePath: record.localPath,
        sizeBytes: record.manifest.totalSizeBytes,
        checksumSha256: record.manifest.checksum,
        errorMessage: null,
        completedAt: createdAt,
        metadata: restoredMetadata,
      };
      await prisma.backupJob.upsert({
        where: { id: record.backupJobId },
        update: data,
        create: { id: record.backupJobId, ...data, createdAt },
      });
    },
    async upsertReindexAudit(record: GitHubCatalogBackupRecord) {
      const createdAt = new Date(record.manifest.createdAt);
      await prisma.auditLog.upsert({
        where: { id: `github-reindex-${record.backupJobId}` },
        update: {
          entityId: record.backupJobId,
          metadata: { backupId: record.backupId, type: record.type, branch: record.branch, commitSha: record.commitSha, source: "github-catalog" },
        },
        create: {
          id: `github-reindex-${record.backupJobId}`,
          action: "BACKUP_REINDEXED_FROM_GITHUB",
          entityType: "BackupJob",
          entityId: record.backupJobId,
          metadata: { backupId: record.backupId, type: record.type, branch: record.branch, commitSha: record.commitSha, source: "github-catalog" },
          createdAt,
        },
      });
    },
    async removeMissingBackups(backupJobIds: string[]) {
      await prisma.backupJob.deleteMany({
        where: {
          type: { in: ["DATABASE", "FULL"] },
          status: "COMPLETED",
          id: { notIn: backupJobIds },
        },
      });
    },
  };
}
