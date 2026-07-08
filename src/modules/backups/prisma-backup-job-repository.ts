import type { BackupJobRepository } from "@/modules/backups/backup-job-service";
import type { BackupManifest } from "@/modules/backups/backup-manifest";

type PrismaBackupJobClient = {
  backupJob: {
    create(input: unknown): Promise<{ id: string }>;
    update(input: unknown): Promise<unknown>;
  };
  backupManifest: {
    create(input: unknown): Promise<unknown>;
  };
  user: { count(input: unknown): Promise<number> };
  tenant: { count(input: unknown): Promise<number> };
  site: { count(input: unknown): Promise<number> };
  mediaAsset: { count(input: unknown): Promise<number> };
  auditLog: {
    create(input: unknown): Promise<unknown>;
  };
};

export function createPrismaBackupJobRepository(
  prisma: PrismaBackupJobClient
): BackupJobRepository {
  return {
    async createJob(input) {
      return prisma.backupJob.create({
        data: {
          type: input.type,
          status: "RUNNING",
          trigger: input.trigger,
          initiatedById: input.initiatedById,
          note: input.note,
          startedAt: new Date()
        },
        select: {
          id: true
        }
      });
    },
    async collectStats() {
      const [usersCount, tenantsCount, sitesCount, mediaFilesCount] =
        await Promise.all([
          prisma.user.count({ where: { deletedAt: null } }),
          prisma.tenant.count({ where: { deletedAt: null } }),
          prisma.site.count({ where: { deletedAt: null } }),
          prisma.mediaAsset.count({ where: { deletedAt: null } })
        ]);

      return {
        usersCount,
        tenantsCount,
        sitesCount,
        mediaFilesCount
      };
    },
    async saveManifest(input: BackupManifest) {
      await prisma.backupManifest.create({
        data: {
          backupJobId: input.backupJobId,
          platformVersion: input.appVersion,
          usersCount: input.usersCount,
          tenantsCount: input.tenantsCount,
          sitesCount: input.sitesCount,
          mediaFilesCount: input.mediaFilesCount,
          compressedSizeBytes: input.totalSizeBytes,
          compressionAlgorithm: input.compressionAlgorithm,
          encryptionEnabled: input.encryptionEnabled,
          sha256Checksum: input.checksum,
          localVerificationStatus: "PASSED",
          githubUploadStatus: "PENDING"
        }
      });
    },
    async markCompleted(input) {
      await prisma.backupJob.update({
        where: {
          id: input.backupJobId
        },
        data: {
          status: "COMPLETED",
          checksumSha256: input.checksumSha256,
          sizeBytes: input.sizeBytes,
          localPath: input.localPath,
          completedAt: input.completedAt
        }
      });
    },
    async markFailed(input) {
      await prisma.backupJob.update({
        where: {
          id: input.backupJobId
        },
        data: {
          status: "FAILED",
          note: input.reason
        }
      });
    },
    async recordAudit(input) {
      await prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata
        }
      });
    }
  };
}
