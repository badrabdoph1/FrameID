import {
  createBackupManifest,
  type BackupType
} from "@/modules/backups/backup-manifest";
import {
  createInMemoryBackupArtifactWriter,
  type BackupArtifactWriter
} from "@/modules/backups/local-backup-artifact-writer";

export type BackupStats = {
  usersCount: number;
  tenantsCount: number;
  sitesCount: number;
  mediaFilesCount: number;
};

export type BackupJobRepository = {
  createJob(input: {
    type: BackupType;
    trigger: "MANUAL" | "AUTO";
    initiatedById?: string;
    note?: string;
  }): Promise<{ id: string }>;
  collectStats(): Promise<BackupStats>;
  saveManifest(input: ReturnType<typeof createBackupManifest>): Promise<void>;
  markCompleted(input: {
    backupJobId: string;
    checksumSha256: string;
    sizeBytes: number;
    localPath?: string;
    completedAt: Date;
  }): Promise<void>;
  markFailed(input: {
    backupJobId: string;
    reason: string;
  }): Promise<void>;
  recordAudit(input: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
};

export function createBackupJobService({
  repository,
  artifactWriter = createInMemoryBackupArtifactWriter(),
  platformVersion,
  now = () => new Date()
}: {
  repository: BackupJobRepository;
  artifactWriter?: BackupArtifactWriter;
  platformVersion: string;
  now?: () => Date;
}) {
  return {
    async runManualBackup(input: {
      type: BackupType;
      initiatedById: string;
      note?: string;
    }): Promise<{ backupJobId: string; status: "COMPLETED" }> {
      const job = await repository.createJob({
        type: input.type,
        trigger: "MANUAL",
        initiatedById: input.initiatedById,
        note: input.note
      });

      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_STARTED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: {
          type: input.type
        }
      });

      try {
        const stats = await repository.collectStats();
        const createdAt = now();
        const artifact = await artifactWriter.writeArtifact({
          backupJobId: job.id,
          type: input.type,
          stats,
          createdAt
        });
        const manifest = createBackupManifest({
          backupJobId: job.id,
          type: input.type,
          platformVersion,
          usersCount: stats.usersCount,
          tenantsCount: stats.tenantsCount,
          sitesCount: stats.sitesCount,
          mediaFilesCount: stats.mediaFilesCount,
          compressedSizeBytes: artifact.sizeBytes,
          compressionAlgorithm: artifact.compressionAlgorithm,
          encryptionEnabled: true,
          payloadChecksum: artifact.payloadChecksum,
          createdAt
        });

        await repository.saveManifest(manifest);
        await repository.markCompleted({
          backupJobId: job.id,
          checksumSha256: artifact.payloadChecksum,
          sizeBytes: artifact.sizeBytes,
          localPath: artifact.localPath,
          completedAt: createdAt
        });
        await repository.recordAudit({
          actorUserId: input.initiatedById,
          action: "BACKUP_COMPLETED",
          entityType: "BackupJob",
          entityId: job.id,
          metadata: {
            checksum: artifact.payloadChecksum,
            localPath: artifact.localPath
          }
        });

        return {
          backupJobId: job.id,
          status: "COMPLETED"
        };
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Unknown backup failure";

        await repository.markFailed({
          backupJobId: job.id,
          reason
        });
        await repository.recordAudit({
          actorUserId: input.initiatedById,
          action: "BACKUP_FAILED",
          entityType: "BackupJob",
          entityId: job.id,
          metadata: {
            reason
          }
        });

        throw error;
      }
    }
  };
}
