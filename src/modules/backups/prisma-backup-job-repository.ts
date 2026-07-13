import type { BackupJobRepository } from "@/modules/backups/backup-job-service";
import type { BackupManifest } from "@/modules/backups/backup-manifest";
import { CUSTOMER_DATA_COUNT_QUERIES } from "@/modules/backups/customer-data-inventory";

type PrismaBackupJobClient = {
  backupJob: {
    create(input: unknown): Promise<{ id: string }>;
    update(input: unknown): Promise<unknown>;
    findUnique?(input: unknown): Promise<{ metadata: unknown } | null>;
  };
  $queryRawUnsafe<T>(query: string): Promise<T>;
  auditLog: { create(input: unknown): Promise<unknown> };
};

function isSystemActor(value: string | undefined): boolean {
  return value === "scheduler" || value === "cli-script" || value === "system";
}

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function createPrismaBackupJobRepository(prisma: PrismaBackupJobClient): BackupJobRepository {
  return {
    async createJob(input) {
      return prisma.backupJob.create({
        data: {
          type: input.type,
          status: "RUNNING",
          triggeredById: input.initiatedById && !isSystemActor(input.initiatedById) ? input.initiatedById : undefined,
          metadata: { trigger: input.trigger, note: input.note, initiatedBy: input.initiatedById ?? "system" } as Record<string, unknown>,
        },
        select: { id: true },
      });
    },
    async collectStats() {
      const entries = await Promise.all(Object.entries(CUSTOMER_DATA_COUNT_QUERIES).map(async ([key, query]) => {
        const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number | string }>>(query);
        return [key, Number(rows[0]?.count ?? 0)] as const;
      }));
      const customerDataCounts = Object.fromEntries(entries);
      return {
        usersCount: customerDataCounts.usersCount ?? 0,
        tenantsCount: customerDataCounts.tenantsCount ?? 0,
        sitesCount: customerDataCounts.sitesCount ?? 0,
        mediaFilesCount: customerDataCounts.mediaFilesCount ?? 0,
        customerDataCounts,
      };
    },
    async saveManifest(_input: BackupManifest) {
      // The manifest is persisted inside the verified backup artifact.
    },
    async markCompleted(input) {
      const current = prisma.backupJob.findUnique
        ? await prisma.backupJob.findUnique({ where: { id: input.backupJobId }, select: { metadata: true } })
        : null;
      await prisma.backupJob.update({
        where: { id: input.backupJobId },
        data: {
          status: "COMPLETED",
          checksumSha256: input.checksumSha256,
          sizeBytes: input.sizeBytes,
          filePath: input.localPath,
          completedAt: input.completedAt,
          metadata: { ...asMetadata(current?.metadata), githubPath: input.githubPath, githubBranch: input.githubBranch, githubCommitSha: input.githubCommitSha, externalStorage: "github", localVerified: true, githubUploaded: true, remoteVerified: true, retentionApplied: true, auditLogged: true },
        },
      });
    },
    async markFailed(input) {
      await prisma.backupJob.update({ where: { id: input.backupJobId }, data: { status: "FAILED", errorMessage: input.reason, completedAt: new Date() } });
    },
    async recordAudit(input) {
      await prisma.auditLog.create({
        data: {
          actorId: input.actorUserId && !isSystemActor(input.actorUserId) ? input.actorUserId : undefined,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: { ...input.metadata, actor: input.actorUserId ?? "system" },
        },
      });
    },
  };
}
