import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { addChecksumToManifest, createBackupManifest, createFileSha256Checksum, type BackupManifest, type BackupType } from "./backup-manifest";
import { createDatabaseDumper } from "./backup-database-dumper";
import { createUploadsPackager } from "./backup-uploads-packager";
import { createBackupPackage } from "./backup-package-creator";
import { createVerificationService } from "./backup-verification-service";
import { createGitHubStorage } from "./backup-storage-github";
import { getBackupPolicy } from "./backup-policy";
import { createFrameIdBackupPipeline, type BackupTrigger } from "./frameid-backup-pipeline";

export type BackupStats = { usersCount: number; tenantsCount: number; sitesCount: number; mediaFilesCount: number };
export type BackupJobRepository = {
  createJob(input: { type: BackupType; trigger: BackupTrigger; initiatedById?: string; note?: string }): Promise<{ id: string }>;
  collectStats(): Promise<BackupStats>; saveManifest(input: BackupManifest): Promise<void>;
  markCompleted(input: { backupJobId: string; checksumSha256: string; sizeBytes: number; localPath?: string; githubPath: string; githubBranch: string; githubCommitSha: string; completedAt: Date }): Promise<void>;
  markFailed(input: { backupJobId: string; reason: string }): Promise<void>;
  recordAudit(input: { actorUserId?: string; action: string; entityType: string; entityId: string; metadata?: Record<string, unknown> }): Promise<void>;
};
export type BackupJobService = { runBackup(input: { type: BackupType; trigger: BackupTrigger; initiatedById?: string; note?: string }): Promise<{ backupJobId: string; backupId: string; status: "COMPLETED"; branch: string; commitSha: string }> };

export function getGitHubBackupBranch(type: BackupType) { return type === "FULL" ? process.env.BACKUP_GITHUB_FULL_BRANCH || "frameid-backups-full" : process.env.BACKUP_GITHUB_DATABASE_BRANCH || "frameid-backups-database"; }

export function createBackupJobService(options: { repository: BackupJobRepository; databaseUrl: string; uploadsDir?: string; backupRoot?: string; backupGitHubToken?: string; backupGitHubRepository?: string; platformVersion: string; gitCommitSha?: string; now?: () => Date }): BackupJobService {
  const { repository } = options; const now = options.now ?? (() => new Date());
  const root = options.backupRoot ?? process.env.BACKUP_DIR ?? join(process.cwd(), "backups");
  const dumper = createDatabaseDumper(options.databaseUrl); const uploads = createUploadsPackager(options.uploadsDir ?? join(process.cwd(), "public", "uploads"));
  const verifier = createVerificationService(); const github = createGitHubStorage(options.backupGitHubToken ?? process.env.BACKUP_GITHUB_TOKEN ?? "", options.backupGitHubRepository);
  let branch = "";
  const pipeline = createFrameIdBackupPipeline({
    createJob: (i) => repository.createJob({ type: i.type, trigger: i.trigger, initiatedById: i.actorId, note: i.note }),
    async createArtifact({ jobId, type }) { const created = now(); const stats = await repository.collectStats(); const db = await dumper.dumpDatabase(root, jobId); const files = type === "FULL" ? await uploads.packageUploads(root, jobId) : null; const manifest = addChecksumToManifest(createBackupManifest({ backupJobId: jobId, backupType: type, appVersion: options.platformVersion, gitCommitSha: options.gitCommitSha ?? "", databaseVersion: await dumper.getMigrationVersion(), ...stats, databaseSizeBytes: db.sizeBytes, uploadsSizeBytes: files?.sizeBytes ?? 0, contentSizeBytes: 0, compressionAlgorithm: "gzip", encryptionEnabled: false, artifactChecksums: { database: await createFileSha256Checksum(db.dumpPath), uploads: files ? await createFileSha256Checksum(files.archivePath) : null }, createdAt: created.toISOString() })); const pkg = await createBackupPackage({ databaseDumpPath: db.dumpPath, uploadsArchivePath: files?.archivePath ?? null, contentArchivePath: null, databaseSizeBytes: db.sizeBytes, uploadsSizeBytes: files?.sizeBytes ?? 0, contentSizeBytes: 0, manifest }, root, created); await repository.saveManifest(manifest); return { backupId: pkg.backupId, backupDir: pkg.backupDir, type, sizeBytes: pkg.totalSizeBytes, checksumSha256: pkg.checksumSha256 }; },
    async verifyArtifact(a, where) { if (where === "LOCAL") { const v = await verifier.verifyBackup(a.backupId, root); return { valid: v.valid, sizeBytes: a.sizeBytes, errors: v.errors }; } if (!github) throw new Error("GitHub غير مضبوط"); const v = await github.verifyBackup(a.backupId, branch); return { valid: v.valid, sizeBytes: v.sizeBytes, errors: v.errors }; },
    async uploadArtifact(a) { if (!github) throw new Error("BACKUP_GITHUB_TOKEN مطلوب؛ النسخة المحلية لا تعتبر مكتملة"); branch = getGitHubBackupBranch(a.type); const u = await github.uploadBackup(a.backupDir, a.backupId, branch); return { branch, commitSha: u.commitSha, remotePath: u.url }; },
    async applyRetention({ type, branch: b }) { if (!github) throw new Error("GitHub غير متاح"); return { removed: await github.cleanupOldBackups(b, getBackupPolicy(type).retentionCount) }; },
    recordAudit: (e) => repository.recordAudit({ actorUserId: e.actorId, action: e.action, entityType: "BackupJob", entityId: e.jobId, metadata: e.metadata }),
    markCompleted: (e) => repository.markCompleted({ backupJobId: e.jobId, checksumSha256: e.artifact.checksumSha256, sizeBytes: e.artifact.sizeBytes, localPath: join(root, e.artifact.backupId), githubPath: e.remotePath, githubBranch: e.branch, githubCommitSha: e.commitSha, completedAt: now() }),
    markFailed: (e) => repository.markFailed({ backupJobId: e.jobId, reason: e.reason }),
    async cleanupLocalArtifact(a) { if (existsSync(a.backupDir)) await rm(a.backupDir, { recursive: true, force: true }); },
  });
  return { runBackup: (input) => pipeline.create({ type: input.type, trigger: input.trigger, actorId: input.initiatedById, note: input.note }) };
}
