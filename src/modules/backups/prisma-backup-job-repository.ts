import type { BackupJobRepository } from "@/modules/backups/backup-job-service";
import type { BackupManifest } from "@/modules/backups/backup-manifest";

type PrismaBackupJobClient = {
  backupJob: {
    create(input: unknown): Promise<{ id: string }>;
    update(input: unknown): Promise<unknown>;
    findUnique?(input: unknown): Promise<{ metadata: unknown } | null>;
  };
  user: { count(input: unknown): Promise<number> };
  tenant: { count(input: unknown): Promise<number> };
  site: { count(input: unknown): Promise<number> };
  mediaAsset: { count(input: unknown): Promise<number> };
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
      const [usersCount, tenantsCount, sitesCount, mediaFilesCount] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.tenant.count({ where: { deletedAt: null } }),
        prisma.site.count({ where: { deletedAt: null } }),
        prisma.mediaAsset.count({ where: { deletedAt: null } }),
      ]);
      return { usersCount, tenantsCount, sitesCount, mediaFilesCount };
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
          metadata: { ...asMetadata(current?.metadata), githubPath: input.githubPath, externalStorage: "github", localVerified: true, githubUploaded: true, remoteVerified: true, retentionApplied: true, auditLogged: true },
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
