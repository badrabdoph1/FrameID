import { join } from "node:path";
import {
  createBackupManifest,
  addChecksumToManifest,
  type BackupType,
  type BackupManifest,
} from "@/modules/backups/backup-manifest";
import { createDatabaseDumper } from "@/modules/backups/backup-database-dumper";
import { createUploadsPackager } from "@/modules/backups/backup-uploads-packager";
import { createBackupPackage } from "@/modules/backups/backup-package-creator";
import { createLocalBackupArtifactWriter } from "@/modules/backups/local-backup-artifact-writer";
import { createRetentionService } from "@/modules/backups/backup-retention";
import { createVerificationService } from "@/modules/backups/backup-verification-service";
import { createAutoRestoreService } from "@/modules/backups/backup-auto-restore-service";
import { createSnapshotService, type SnapshotResult } from "@/modules/backups/backup-snapshot-service";
import { createBackupScheduler, type BackupScheduler } from "@/modules/backups/backup-scheduler";
import { createGitHubStorage } from "@/modules/backups/backup-storage-github";
import { getBackupPolicy } from "@/modules/backups/backup-policy";
import type { VerificationResult } from "@/modules/backups/backup-verification-service";
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
  runManualBackup(input: { type: BackupType; initiatedById: string; note?: string }): Promise<{ backupJobId: string; status: "COMPLETED"; backupId: string }>;
  runScheduledBackup(type: BackupType): Promise<{ backupJobId: string; status: "COMPLETED"; backupId: string } | null>;
  createSnapshot(input: { reason: string; databaseUrl: string; initiatedById: string }): Promise<SnapshotResult>;
  verifyBackup(backupId: string): Promise<VerificationResult>;
  verifyAllBackups(): Promise<{ results: VerificationResult[]; total: number; valid: number; invalid: number }>;
  checkAndAutoRestore(options: AutoRestoreOptions): Promise<{ needed: boolean; restored: boolean; result: import("@/modules/backups/backup-restore-service").RestoreResult | null; reason: string }>;
  getScheduler(): BackupScheduler;
};

type ExecuteBackupInput = { type: BackupType; trigger: "MANUAL" | "AUTO"; initiatedById?: string; note?: string };
type ExecuteBackupResult = { backupJobId: string; status: "COMPLETED"; backupId: string; manifest: BackupManifest };

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
  const githubStorage = createGitHubStorage(backupGitHubToken ?? process.env.BACKUP_GITHUB_TOKEN ?? "", backupGitHubRepository);

  const dbDumper = createDatabaseDumper(databaseUrl);
  const uploadPkg = createUploadsPackager(uploadRoot);
  const writer = createLocalBackupArtifactWriter({ backupRoot: root });
  const retention = createRetentionService();
  const verification = createVerificationService();
  const autoRestoreService = createAutoRestoreService();
  const snapshotService = createSnapshotService();
  const scheduler = createBackupScheduler(
    { backupSettings: { findMany: () => Promise.resolve([]) } },
    () => ({ runManualBackup: (input) => (service as BackupJobService).runManualBackup(input) })
  );

  async function executeBackup(input: ExecuteBackupInput): Promise<ExecuteBackupResult> {
    const createdAt = now();
    const job = await repository.createJob({ type: input.type, trigger: input.trigger, initiatedById: input.initiatedById, note: input.note });

    await repository.recordAudit({
      actorUserId: input.initiatedById,
      action: "BACKUP_STARTED",
      entityType: "BackupJob",
      entityId: job.id,
      metadata: { type: input.type, requiredExternalStorage: "github" },
    });

    try {
      if (!githubStorage) throw new Error("BACKUP_GITHUB_TOKEN is required. A backup cannot be completed without GitHub storage.");

      const stats = await repository.collectStats();
      const includeUploads = input.type === "FULL";
      const dbResult = await dbDumper.dumpDatabase(root, job.id);
      const uploadResult = includeUploads ? await uploadPkg.packageUploads(root, job.id) : null;
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
        databaseSizeBytes: dbResult.sizeBytes,
        uploadsSizeBytes: uploadResult?.sizeBytes ?? 0,
        contentSizeBytes: 0,
        compressionAlgorithm: "gzip",
        encryptionEnabled: !!backupEncryptionKey,
        createdAt: createdAt.toISOString(),
      });
      const manifest = addChecksumToManifest(manifestInput);

      const backupPackage = await createBackupPackage({
        databaseDumpPath: dbResult.dumpPath,
        uploadsArchivePath: uploadResult?.archivePath ?? null,
        contentArchivePath: null,
        databaseSizeBytes: dbResult.sizeBytes,
        uploadsSizeBytes: uploadResult?.sizeBytes ?? 0,
        contentSizeBytes: 0,
        manifest,
      }, root, createdAt);

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

      const localVerification = await verification.verifyBackup(backupPackage.backupId, root);
      if (!localVerification.valid) throw new Error(`Local verification failed: ${localVerification.errors.join("; ")}`);
      await repository.recordAudit({ actorUserId: input.initiatedById, action: "BACKUP_LOCAL_VERIFIED", entityType: "BackupJob", entityId: job.id, metadata: { backupId: backupPackage.backupId, durationMs: localVerification.durationMs } });

      const branch = getGitHubBackupBranch(input.type);
      const uploaded = await githubStorage.uploadBackup(backupPackage.backupDir, backupPackage.backupId, branch);
      const remoteVerification = await githubStorage.verifyBackup(backupPackage.backupId, branch);
      if (!remoteVerification.valid) throw new Error(`GitHub verification failed: ${remoteVerification.errors.join("; ")}`);

      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_GITHUB_VERIFIED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: { branch, commitSha: uploaded.commitSha, sizeBytes: remoteVerification.sizeBytes },
      });

      await repository.saveManifest(manifest);
      await repository.markCompleted({
        backupJobId: job.id,
        checksumSha256: backupPackage.checksumSha256,
        sizeBytes: backupPackage.totalSizeBytes,
        localPath: backupPackage.backupDir,
        githubPath: uploaded.url,
        completedAt: now(),
      });

      await repository.recordAudit({
        actorUserId: input.initiatedById,
        action: "BACKUP_COMPLETED",
        entityType: "BackupJob",
        entityId: job.id,
        metadata: { checksum: backupPackage.checksumSha256, backupId: backupPackage.backupId, localPath: backupPackage.backupDir, githubPath: uploaded.url, githubCommitSha: uploaded.commitSha },
      });

      const settings = await getBackupSettings(input.type);
      const policyRetention = input.type === "FULL" ? 10 : 20;
      const retentionCount = settings?.retentionCount ?? policyRetention;
      await githubStorage.cleanupOldBackups(branch, retentionCount);
      if (retentionCount > 0) await retention.cleanupByType(root, input.type, retentionCount);

      return { backupJobId: job.id, status: "COMPLETED", backupId: backupPackage.backupId, manifest };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown backup failure";
      await repository.markFailed({ backupJobId: job.id, reason });
      await repository.recordAudit({ actorUserId: input.initiatedById, action: "BACKUP_FAILED", entityType: "BackupJob", entityId: job.id, metadata: { reason } });
      throw error;
    }
  }

  const service: BackupJobService = {
    async runManualBackup(input) {
      const result = await executeBackup({ ...input, trigger: "MANUAL" });
      return { backupJobId: result.backupJobId, status: result.status, backupId: result.backupId };
    },
    async runScheduledBackup(type) {
      try {
        const result = await executeBackup({ type, trigger: "AUTO", note: "scheduled backup" });
        return { backupJobId: result.backupJobId, status: result.status, backupId: result.backupId };
      } catch {
        return null;
      }
    },
    async createSnapshot(input) {
      return snapshotService.createSnapshot({ reason: input.reason, databaseUrl: input.databaseUrl, uploadsDir: uploadRoot, contentDir: join(process.cwd(), "content"), backupRoot: root, platformVersion, gitCommitSha, initiatedById: input.initiatedById });
    },
    async verifyBackup(backupId) { return verification.verifyBackup(backupId, root); },
    async verifyAllBackups() { return verification.verifyAllBackups(root); },
    async checkAndAutoRestore(options) { return autoRestoreService.checkAndRestore({ ...options, backupRoot: root, uploadsDir: uploadRoot, contentDir: join(process.cwd(), "content") }); },
    getScheduler() { return scheduler; },
  };

  return service;
}

async function getBackupSettings(backupType: BackupType): Promise<{ retentionCount: number } | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    return prisma.backupSettings.findUnique({ where: { type: backupType }, select: { retentionCount: true } });
  } catch {
    return null;
  }
}
