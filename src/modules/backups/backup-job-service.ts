import { join } from "node:path";
import {
  createBackupManifest,
  addChecksumToManifest,
  type BackupType,
} from "@/modules/backups/backup-manifest";
import { createDatabaseDumper } from "@/modules/backups/backup-database-dumper";
import { createUploadsPackager } from "@/modules/backups/backup-uploads-packager";
import { createContentPackager } from "@/modules/backups/backup-content-packager";
import { createBackupPackage } from "@/modules/backups/backup-package-creator";
import { createLocalBackupArtifactWriter } from "@/modules/backups/local-backup-artifact-writer";
import { createRetentionService } from "@/modules/backups/backup-retention";

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
  saveManifest(input: Record<string, unknown>): Promise<void>;
  markCompleted(input: {
    backupJobId: string;
    checksumSha256: string;
    sizeBytes: number;
    localPath?: string;
    githubPath?: string;
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
  databaseUrl,
  uploadsDir,
  contentDir,
  backupRoot,
  backupEncryptionKey,
  platformVersion,
  gitCommitSha,
  now = () => new Date(),
}: {
  repository: BackupJobRepository;
  databaseUrl: string;
  uploadsDir?: string;
  contentDir?: string;
  backupRoot?: string;
  backupGitHubToken?: string;
  backupEncryptionKey?: string;
  platformVersion: string;
  gitCommitSha?: string;
  now?: () => Date;
}) {
  const root = backupRoot ?? join(process.cwd(), "backups");
  const uploadRoot = uploadsDir ?? join(process.cwd(), "public", "uploads");
  const contentRoot = contentDir ?? join(process.cwd(), "content");

  const dbDumper = createDatabaseDumper(databaseUrl);
  const uploadPkg = createUploadsPackager(uploadRoot);
  const contentPkg = createContentPackager(contentRoot);
  const writer = createLocalBackupArtifactWriter({ backupRoot: root });
  const retention = createRetentionService();

  return {
    async runManualBackup(input: {
      type: BackupType;
      initiatedById: string;
      note?: string;
    }): Promise<{ backupJobId: string; status: "COMPLETED"; backupId: string }> {
      const createdAt = now();

      const job = await repository.createJob({
        type: input.type,
        trigger: "MANUAL",
        initiatedById: input.initiatedById,
        note: input.note,
      });

      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_STARTED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: { type: input.type },
      });

      try {
        const stats = await repository.collectStats();
        const doFull = input.type === "FULL";
        const doUploads = input.type === "UPLOADS" || doFull;

        let databaseDumpPath: string | null = null;
        let databaseSizeBytes = 0;
        let uploadsArchivePath: string | null = null;
        let uploadsSizeBytes = 0;
        let contentArchivePath: string | null = null;
        let contentSizeBytes = 0;

        if (input.type === "DATABASE" || doFull) {
          const dbResult = await dbDumper.dumpDatabase(root, job.id);
          databaseDumpPath = dbResult.dumpPath;
          databaseSizeBytes = dbResult.sizeBytes;
        }

        if (doUploads) {
          const upResult = await uploadPkg.packageUploads(root, job.id);
          uploadsArchivePath = upResult.archivePath;
          uploadsSizeBytes = upResult.sizeBytes;
        }

        if (doFull) {
          const ctResult = await contentPkg.packageContent(root, job.id);
          contentArchivePath = ctResult.archivePath;
          contentSizeBytes = ctResult.sizeBytes;
        }

        const migrationVersion = await dbDumper.getMigrationVersion();

        const manifestInput = createBackupManifest({
          backupJobId: job.id,
          backupType: input.type,
          appVersion: platformVersion,
          gitCommitSha: gitCommitSha ?? "",
          databaseVersion: migrationVersion,
          usersCount: stats.usersCount,
          tenantsCount: stats.tenantsCount,
          sitesCount: stats.sitesCount,
          mediaFilesCount: stats.mediaFilesCount,
          databaseSizeBytes,
          uploadsSizeBytes,
          contentSizeBytes,
          compressionAlgorithm: "gzip",
          encryptionEnabled: !!backupEncryptionKey,
          createdAt: createdAt.toISOString(),
        });

        const manifest = addChecksumToManifest(manifestInput);

        const backupPackage = await createBackupPackage(
          {
            databaseDumpPath,
            uploadsArchivePath,
            contentArchivePath,
            databaseSizeBytes,
            uploadsSizeBytes,
            contentSizeBytes,
            manifest: manifest as unknown as Record<string, unknown>,
          },
          root,
          createdAt
        );

        await writer.writeBackup({
          backupId: backupPackage.backupId,
          type: input.type,
          databaseDumpPath: backupPackage.databaseDumpPath ?? "",
          uploadsArchivePath: backupPackage.uploadsArchivePath,
          contentArchivePath: backupPackage.contentArchivePath,
          databaseSizeBytes: backupPackage.databaseSizeBytes,
          uploadsSizeBytes: backupPackage.uploadsSizeBytes,
          contentSizeBytes: backupPackage.contentSizeBytes,
          manifest: manifest as unknown as Record<string, unknown>,
          checksumSha256: backupPackage.checksumSha256,
        });

        await repository.saveManifest(
          manifest as unknown as Record<string, unknown>
        );

        await repository.markCompleted({
          backupJobId: job.id,
          checksumSha256: backupPackage.checksumSha256,
          sizeBytes: backupPackage.totalSizeBytes,
          localPath: backupPackage.backupDir,
          completedAt: createdAt,
        });

        await repository.recordAudit({
          actorUserId: input.initiatedById,
          action: "BACKUP_COMPLETED",
          entityType: "BackupJob",
          entityId: job.id,
          metadata: {
            checksum: backupPackage.checksumSha256,
            backupId: backupPackage.backupId,
            backupDir: backupPackage.backupDir,
          },
        });

        const settings = await getBackupSettings(input.type);
        if (settings && settings.retentionCount > 0) {
          await retention.cleanup(root, settings.retentionCount);
        }

        return {
          backupJobId: job.id,
          status: "COMPLETED",
          backupId: backupPackage.backupId,
        };
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Unknown backup failure";

        await repository.markFailed({
          backupJobId: job.id,
          reason,
        });
        await repository.recordAudit({
          actorUserId: input.initiatedById,
          action: "BACKUP_FAILED",
          entityType: "BackupJob",
          entityId: job.id,
          metadata: { reason },
        });

        throw error;
      }
    },

    async runScheduledBackup(_type: BackupType): Promise<{
      backupJobId: string;
      status: "COMPLETED";
      backupId: string;
    } | null> {
      return null;
    },
  };
}

async function getBackupSettings(
  backupType: BackupType
): Promise<{ retentionCount: number } | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.backupSettings.findUnique({
      where: { type: backupType },
      select: { retentionCount: true },
    });
    return settings;
  } catch {
    return null;
  }
}
