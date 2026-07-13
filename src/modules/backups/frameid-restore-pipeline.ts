import { dirname, join } from "node:path";
import { createFrameIdRestorePipeline } from "./frameid-backup-pipeline";
import { createRestoreService } from "./backup-restore-service";
import { createVerificationService } from "./backup-verification-service";
import { getGitHubBackupBranch } from "./backup-job-service";

type Client = { restoreJob: { count(i: unknown): Promise<number>; create(i: unknown): Promise<{ id: string }>; upsert(i: unknown): Promise<unknown> }; auditLog: { create(i: unknown): Promise<unknown> } };
export function createOfficialRestorePipeline(input: { prisma: Client; databaseUrl: string; backupRoot?: string; uploadsDir?: string; githubToken?: string; githubRepository?: string }) { const root = input.backupRoot ?? process.env.BACKUP_DIR ?? join(process.cwd(), "backups"); const service = createRestoreService(); const verifier = createVerificationService(); return createFrameIdRestorePipeline({
  async createJob(command) { if (await input.prisma.restoreJob.count({ where: { status: { in: ["PENDING", "RUNNING"] } } })) throw new Error("توجد استعادة قيد التنفيذ"); return input.prisma.restoreJob.create({ data: { backupJobId: command.backupId, status: "RUNNING", triggeredById: command.actorId }, select: { id: true } }); },
  resolve: (c) => service.ensureBackupAvailable({ backupId: c.backupId, backupRoot: root, type: c.type, githubToken: input.githubToken, githubRepository: input.githubRepository, githubBranch: getGitHubBackupBranch(c.type) }),
  async verify(c) { const result = await verifier.verifyBackup(c.backupId, dirname(c.backupDir)); return { valid: result.valid, errors: result.errors }; },
  async apply(c) { const result = await service.applyVerifiedRestore({ backupDir: c.backupDir, databaseUrl: input.databaseUrl, uploadsDir: input.uploadsDir, type: c.type }); if (!result.success) throw new Error(result.errors.join("; ")); },
  async verifyRestored() { const result = await service.validatePostRestore(input.databaseUrl); return { valid: result.passed, errors: result.errors }; },
  async audit(e) { await input.prisma.auditLog.create({ data: { actorId: e.actorId, action: e.action, entityType: "RestoreJob", entityId: e.jobId, metadata: { ...e.metadata, backupId: e.backupId } } }); },
  complete: (e) => input.prisma.restoreJob.upsert({ where: { id: e.jobId }, update: { status: "COMPLETED", completedAt: new Date(), targetDatabase: e.source }, create: { id: e.jobId, backupJobId: e.jobId, status: "COMPLETED", completedAt: new Date(), targetDatabase: e.source } }).then(() => undefined),
  fail: (e) => input.prisma.restoreJob.upsert({ where: { id: e.jobId }, update: { status: "FAILED", completedAt: new Date(), errorMessage: e.reason }, create: { id: e.jobId, backupJobId: e.jobId, status: "FAILED", completedAt: new Date(), errorMessage: e.reason } }).then(() => undefined),
}); }
