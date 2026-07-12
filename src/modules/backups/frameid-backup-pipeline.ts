import type { BackupType } from "./backup-manifest";

export type BackupTrigger = "MANUAL" | "AUTO" | "MIGRATION" | "CLI" | "GITHUB_ACTIONS";
export type BackupArtifactDescriptor = { backupId: string; backupDir: string; type: BackupType; sizeBytes: number; checksumSha256: string };
export type BackupPipelineDependencies = {
  createJob(input: { type: BackupType; trigger: BackupTrigger; actorId?: string; note?: string }): Promise<{ id: string }>;
  createArtifact(input: { jobId: string; type: BackupType }): Promise<BackupArtifactDescriptor>;
  verifyArtifact(artifact: BackupArtifactDescriptor, location: "LOCAL" | "REMOTE"): Promise<{ valid: boolean; sizeBytes: number; errors: string[] }>;
  uploadArtifact(artifact: BackupArtifactDescriptor): Promise<{ branch: string; commitSha: string; remotePath: string }>;
  applyRetention(input: { type: BackupType; branch: string }): Promise<{ removed: string[] }>;
  recordAudit(input: { jobId: string; actorId?: string; action: "BACKUP_STARTED" | "BACKUP_COMPLETED" | "BACKUP_FAILED"; metadata: Record<string, unknown> }): Promise<void>;
  markCompleted(input: { jobId: string; artifact: BackupArtifactDescriptor; branch: string; commitSha: string; remotePath: string }): Promise<void>;
  markFailed(input: { jobId: string; reason: string }): Promise<void>;
  cleanupLocalArtifact(artifact: BackupArtifactDescriptor): Promise<void>;
};

export function createFrameIdBackupPipeline(deps: BackupPipelineDependencies) {
  return { async create(input: { type: BackupType; trigger: BackupTrigger; actorId?: string; note?: string }) {
    const job = await deps.createJob(input); const startedAt = Date.now();
    try {
      await deps.recordAudit({ jobId: job.id, actorId: input.actorId, action: "BACKUP_STARTED", metadata: { type: input.type, trigger: input.trigger } });
      const artifact = await deps.createArtifact({ jobId: job.id, type: input.type });
      const local = await deps.verifyArtifact(artifact, "LOCAL");
      if (!local.valid) throw new Error(`فشل التحقق المحلي: ${local.errors.join("; ")}`);
      const remote = await deps.uploadArtifact(artifact);
      const remoteCheck = await deps.verifyArtifact(artifact, "REMOTE");
      if (!remoteCheck.valid) throw new Error(`فشل التحقق البعيد: ${remoteCheck.errors.join("; ")}`);
      const retention = await deps.applyRetention({ type: input.type, branch: remote.branch });
      await deps.recordAudit({ jobId: job.id, actorId: input.actorId, action: "BACKUP_COMPLETED", metadata: { type: input.type, trigger: input.trigger, durationMs: Date.now() - startedAt, localVerified: true, githubUploaded: true, remoteVerified: true, retentionRemoved: retention.removed, branch: remote.branch, commitSha: remote.commitSha, sizeBytes: remoteCheck.sizeBytes } });
      await deps.markCompleted({ jobId: job.id, artifact, ...remote });
      await deps.cleanupLocalArtifact(artifact);
      return { backupJobId: job.id, backupId: artifact.backupId, status: "COMPLETED" as const, branch: remote.branch, commitSha: remote.commitSha };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "فشل النسخ";
      await deps.markFailed({ jobId: job.id, reason });
      await deps.recordAudit({ jobId: job.id, actorId: input.actorId, action: "BACKUP_FAILED", metadata: { type: input.type, trigger: input.trigger, reason, durationMs: Date.now() - startedAt } }).catch(() => undefined);
      throw error;
    }
  }};
}

export type RestorePipelineDependencies = {
  createJob(input: { backupId: string; type: BackupType; trigger: BackupTrigger; actorId?: string }): Promise<{ id: string }>;
  resolve(input: { backupId: string; type: BackupType }): Promise<{ backupDir: string; source: "LOCAL" | "GITHUB" }>;
  verify(input: { backupId: string; backupDir: string; type: BackupType }): Promise<{ valid: boolean; errors: string[] }>;
  apply(input: { backupId: string; backupDir: string; type: BackupType }): Promise<void>;
  verifyRestored(): Promise<{ valid: boolean; errors: string[] }>;
  audit(input: { jobId: string; backupId: string; actorId?: string; action: "RESTORE_STARTED" | "RESTORE_COMPLETED" | "RESTORE_FAILED"; metadata: Record<string, unknown> }): Promise<void>;
  complete(input: { jobId: string; source: "LOCAL" | "GITHUB" }): Promise<void>;
  fail(input: { jobId: string; reason: string }): Promise<void>;
};
export function createFrameIdRestorePipeline(deps: RestorePipelineDependencies) { return { async restore(input: { backupId: string; type: BackupType; trigger: BackupTrigger; actorId?: string }) { const job = await deps.createJob(input); const started = Date.now(); let source: "LOCAL" | "GITHUB" = "LOCAL"; try { await deps.audit({ jobId: job.id, backupId: input.backupId, actorId: input.actorId, action: "RESTORE_STARTED", metadata: { type: input.type, trigger: input.trigger } }); const artifact = await deps.resolve(input); source = artifact.source; const check = await deps.verify({ ...input, backupDir: artifact.backupDir }); if (!check.valid) throw new Error(`فشل التحقق قبل الاستعادة: ${check.errors.join("; ")}`); await deps.apply({ ...input, backupDir: artifact.backupDir }); const post = await deps.verifyRestored(); if (!post.valid) throw new Error(`فشل التحقق بعد الاستعادة: ${post.errors.join("; ")}`); await deps.audit({ jobId: job.id, backupId: input.backupId, actorId: input.actorId, action: "RESTORE_COMPLETED", metadata: { type: input.type, trigger: input.trigger, source, durationMs: Date.now() - started } }); await deps.complete({ jobId: job.id, source }); return { restoreJobId: job.id, backupId: input.backupId, type: input.type, source, status: "COMPLETED" as const }; } catch (error) { const reason = error instanceof Error ? error.message : "فشل الاستعادة"; await deps.fail({ jobId: job.id, reason }); await deps.audit({ jobId: job.id, backupId: input.backupId, actorId: input.actorId, action: "RESTORE_FAILED", metadata: { reason, source, durationMs: Date.now() - started } }).catch(() => undefined); throw error; } } }; }
