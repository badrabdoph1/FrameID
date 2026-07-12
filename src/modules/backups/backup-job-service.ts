import { join } from "node:path";
import { unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  createBackupManifest,
  addChecksumToManifest,
  type BackupType,
  type BackupManifest,
} from "@/modules/backups/backup-manifest";
import { prisma } from "@/lib/prisma";
import { createDatabaseDumper } from "@/modules/backups/backup-database-dumper";
import { createUploadsPackager } from "@/modules/backups/backup-uploads-packager";
import { createBackupPackage } from "@/modules/backups/backup-package-creator";
import { createLocalBackupArtifactWriter } from "@/modules/backups/local-backup-artifact-writer";
import { createRetentionService } from "@/modules/backups/backup-retention";
import { createVerificationService } from "@/modules/backups/backup-verification-service";
import { createBackupScheduler, type BackupScheduler } from "@/modules/backups/backup-scheduler";
import { createGitHubStorage } from "@/modules/backups/backup-storage-github";
import { getBackupPolicy } from "@/modules/backups/backup-policy";
import type { VerificationResult } from "@/modules/backups/backup-verification-service";
import type { SnapshotResult } from "@/modules/backups/backup-snapshot-service";
import type { AutoRestoreOptions } from "@/modules/backups/backup-auto-restore-service";

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
  saveManifest(input: BackupManifest): Promise<void>;
  markCompleted(input: {
    backupJobId: string;
    checksumSha256: string;
    sizeBytes: number;
    localPath?: string;
    githubPath?: string;
    completedAt: Date;
  }): Promise<void>;
  markFailed(input: { backupJobId: string; reason: string }): Promise<void>;
  recordAudit(input: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
};

export type BackupJobService = {
  runManualBackup(input: {
    type: BackupType;
    initiatedById: string;
    note?: string;
  }): Promise<{ backupJobId: string; status: "COMPLETED"; backupId: string }>;
  runScheduledBackup(type: BackupType): Promise<{
    backupJobId: string;
    status: "COMPLETED";
    backupId: string;
  } | null>;
  createSnapshot(input: {
    reason: string;
    databaseUrl: string;
    initiatedById: string;
  }): Promise<SnapshotResult>;
  verifyBackup(backupId: string): Promise<VerificationResult>;
  verifyAllBackups(): Promise<{
    results: VerificationResult[];
    total: number;
    valid: number;
    invalid: number;
  }>;
  checkAndAutoRestore(options: AutoRestoreOptions): Promise<{
    needed: boolean;
    restored: boolean;
    result: import("@/modules/backups/backup-restore-service").RestoreResult | null;
    reason: string;
  }>;
  getScheduler(): BackupScheduler;
};

type ExecuteBackupInput = {
  type: BackupType;
  trigger: "MANUAL" | "AUTO";
  initiatedById?: string;
  note?: string;
};

type ExecuteBackupResult = {
  backupJobId: string;
  status: "COMPLETED";
  backupId: string;
  manifest: BackupManifest;
};

export function getGitHubBackupBranch(type: BackupType): string {
  return type === "FULL"
    ? process.env.BACKUP_GITHUB_FULL_BRANCH || "frameid-backups-full"
    : process.env.BACKUP_GITHUB_DATABASE_BRANCH || "frameid-backups-database";
}

export function createBackupJobService({
  repository,
  databaseUrl,
  uploadsDir,
  backupRoot,
  backupGitHubToken,
  backupGitHubRepository,
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
  backupGitHubRepository?: string;
  backupEncryptionKey?: string;
  platformVersion: string;
  gitCommitSha?: string;
  now?: () => Date;
}): BackupJobService {
  const root = backupRoot ?? process.env.BACKUP_DIR ?? join(process.cwd(), "backups");
  const uploadRoot = uploadsDir ?? join(process.cwd(), "public", "uploads");
  const githubStorage = createGitHubStorage(
    backupGitHubToken ?? process.env.BACKUP_GITHUB_TOKEN ?? "",
    backupGitHubRepository
  );

  const dbDumper = createDatabaseDumper(databaseUrl);
  const uploadPkg = createUploadsPackager(uploadRoot);
  const writer = createLocalBackupArtifactWriter({ backupRoot: root });
  const retention = createRetentionService();
  const verification = createVerificationService();
  const scheduler = createBackupScheduler(
    { backupSettings: { findMany: () => prisma.backupSettings.findMany({ orderBy: { type: "asc" } }) } },
    () => ({
      runManualBackup: (input) => (service as BackupJobService).runManualBackup(input),
    })
  );

  async function executeBackup(input: ExecuteBackupInput): Promise<ExecuteBackupResult> {
    const createdAt = now();
    const job = await repository.createJob({
      type: input.type,
      trigger: input.trigger,
      initiatedById: input.initiatedById,
      note: input.note,
    });

    await repository.recordAudit({
      actorUserId: input.initiatedById,
      action: "BACKUP_STARTED",
      entityType: "BackupJob",
      entityId: job.id,
      metadata: { type: input.type, requiredExternalStorage: "github" },
    });

    try {
      const hasGitHub = Boolean(githubStorage);

      if (!hasGitHub) {
        console.warn("[BACKUP] BACKUP_GITHUB_TOKEN not configured — running local-only backup.");
      }

      const stats = await repository.collectStats();
      const includeUploads = input.type === "FULL";
      const dbResult = await dbDumper.dumpDatabase(root, job.id);
      const uploadResult = includeUploads
        ? await uploadPkg.packageUploads(root, job.id)
        : null;
      const migrationVersion = await dbDumper.getMigrationVersion();

      const manifest = addChecksumToManifest(
        createBackupManifest({
          backupJobId: job.id,
          backupType: input.type,
          appVersion: platformVersion,
          gitCommitSha: gitCommitSha ?? "",
          databaseVersion: migrationVersion,
          usersCount: stats.usersCount,
          tenantsCount: stats.tenantsCount,
          sitesCount: stats.sitesCount,
          mediaFilesCount: stats.mediaFilesCount,
          databaseSizeBytes: dbResult.sizeBytes,
          uploadsSizeBytes: uploadResult?.sizeBytes ?? 0,
          contentSizeBytes: 0,
          compressionAlgorithm: "gzip",
          encryptionEnabled: !!backupEncryptionKey,
          createdAt: createdAt.toISOString(),
        })
      );

      const backupPackage = await createBackupPackage(
        {
          databaseDumpPath: dbResult.dumpPath,
          uploadsArchivePath: uploadResult?.archivePath ?? null,
          contentArchivePath: null,
          databaseSizeBytes: dbResult.sizeBytes,
          uploadsSizeBytes: uploadResult?.sizeBytes ?? 0,
          contentSizeBytes: 0,
          manifest,
        },
        root,
        createdAt
      );

      await writer.writeBackup({
        backupId: backupPackage.backupId,
        type: input.type,
        databaseDumpPath: backupPackage.databaseDumpPath ?? "",
        uploadsArchivePath: backupPackage.uploadsArchivePath,
        contentArchivePath: null,
        databaseSizeBytes: backupPackage.databaseSizeBytes,
        uploadsSizeBytes: backupPackage.uploadsSizeBytes,
        contentSizeBytes: 0,
        manifest,
        checksumSha256: backupPackage.checksumSha256,
      });

      const rootLevelDump = join(root, "database.sql.gz");
      if (existsSync(rootLevelDump) && backupPackage.databaseDumpPath !== rootLevelDump) {
        await unlink(rootLevelDump).catch(() => undefined);
      }

      const localVerification = await verification.verifyBackup(
        backupPackage.backupId,
        root
      );
      if (!localVerification.valid) {
        throw new Error(
          `Local verification failed: ${localVerification.errors.join("; ")}`
        );
      }

      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_LOCAL_VERIFIED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: {
          backupId: backupPackage.backupId,
          durationMs: localVerification.durationMs,
        },
      });

      let uploadedUrl = "";
      let uploadedCommitSha = "";
      if (hasGitHub) {
        const branch = getGitHubBackupBranch(input.type);
        const uploaded = await githubStorage!.uploadBackup(
          backupPackage.backupDir,
          backupPackage.backupId,
          branch
        );
        const remoteVerification = await githubStorage!.verifyBackup(
          backupPackage.backupId,
          branch
        );
        if (!remoteVerification.valid) {
          throw new Error(
            `GitHub verification failed: ${remoteVerification.errors.join("; ")}`
          );
        }

        await repository.recordAudit({
          actorUserId: input.initiatedById,
          action: "BACKUP_GITHUB_VERIFIED",
          entityType: "BackupJob",
          entityId: job.id,
          metadata: {
            branch,
            commitSha: uploaded.commitSha,
            sizeBytes: remoteVerification.sizeBytes,
          },
        });
        uploadedUrl = uploaded.url;
        uploadedCommitSha = uploaded.commitSha;
      }

      await repository.saveManifest(manifest);
      await repository.markCompleted({
        backupJobId: job.id,
        checksumSha256: backupPackage.checksumSha256,
        sizeBytes: backupPackage.totalSizeBytes,
        localPath: backupPackage.backupDir,
        githubPath: uploadedUrl || undefined,
        completedAt: now(),
      });

      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_COMPLETED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: {
          checksum: backupPackage.checksumSha256,
          backupId: backupPackage.backupId,
          localPath: backupPackage.backupDir,
          githubPath: uploadedUrl,
          githubCommitSha: uploadedCommitSha,
          localOnly: !hasGitHub,
        },
      });

      const retentionCount = getBackupPolicy(input.type).retentionCount;
      if (hasGitHub) {
        const branch = getGitHubBackupBranch(input.type);
        await githubStorage!.cleanupOldBackups(branch, retentionCount);
      }
      await retention.cleanupByType(root, input.type, retentionCount);

      return {
        backupJobId: job.id,
        status: "COMPLETED",
        backupId: backupPackage.backupId,
        manifest,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown backup failure";
      await repository.markFailed({ backupJobId: job.id, reason });
      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_FAILED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: { reason },
      });
      throw error;
    }
  }

  const service: BackupJobService = {
    async runManualBackup(input) {
      const result = await executeBackup({ ...input, trigger: "MANUAL" });
      return {
        backupJobId: result.backupJobId,
        status: result.status,
        backupId: result.backupId,
      };
    },

    async runScheduledBackup(type) {
      try {
        const result = await executeBackup({
          type,
          trigger: "AUTO",
          note: "scheduled backup",
        });
        return {
          backupJobId: result.backupJobId,
          status: result.status,
          backupId: result.backupId,
        };
      } catch {
        return null;
      }
    },

    async createSnapshot(input) {
      const startedAt = Date.now();
      try {
        const result = await executeBackup({
          type: "FULL",
          trigger: "MANUAL",
          initiatedById: input.initiatedById,
          note: input.reason || "migration full backup",
        });
        return {
          backupId: result.backupId,
          backupDir: join(root, result.backupId),
          success: true,
          durationMs: Date.now() - startedAt,
        };
      } catch (error) {
        return {
          backupId: "",
          backupDir: "",
          success: false,
          error: error instanceof Error ? error.message : "Full backup failed",
          durationMs: Date.now() - startedAt,
        };
      }
    },

    async verifyBackup(backupId) {
      return verification.verifyBackup(backupId, root);
    },

    async verifyAllBackups() {
      return verification.verifyAllBackups(root);
    },

    async checkAndAutoRestore(_options) {
      return {
        needed: false,
        restored: false,
        result: null,
        reason:
          "Legacy local auto-restore is disabled. Use the verified GitHub restore workflow.",
      };
    },

    getScheduler() {
      return scheduler;
    },
  };

  return service;
}
