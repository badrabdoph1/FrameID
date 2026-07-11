"use server";

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createRestoreService } from "@/modules/backups/backup-restore-service";
import { createVerificationService } from "@/modules/backups/backup-verification-service";
import { createGitHubStorage } from "@/modules/backups/backup-storage-github";
import { getGitHubBackupBranch } from "@/modules/backups/backup-job-service";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

async function getArtifact(backupJobId: string) {
  const job = await prisma.backupJob.findUnique({
    where: { id: backupJobId },
    select: { id: true, type: true, status: true, filePath: true, metadata: true },
  });
  if (!job) throw new Error("النسخة غير موجودة.");
  if (job.status !== "COMPLETED") throw new Error("لا يمكن استخدام نسخة غير مكتملة.");
  if (!isSupportedBackupType(job.type)) throw new Error("نوع النسخة غير مدعوم.");
  if (!job.filePath) throw new Error("معرّف ملف النسخة غير متاح.");

  const expectedRoot = resolve(process.env.BACKUP_DIR || resolve(process.cwd(), "backups"));
  const backupDir = resolve(job.filePath);
  if (!backupDir.startsWith(`${expectedRoot}/`)) throw new Error("مسار النسخة غير صالح.");

  const metadata = job.metadata && typeof job.metadata === "object" && !Array.isArray(job.metadata)
    ? job.metadata as Record<string, unknown>
    : {};

  return {
    job,
    backupDir,
    backupRoot: dirname(backupDir),
    artifactId: basename(backupDir),
    branch: getGitHubBackupBranch(job.type),
    githubPath: typeof metadata.githubPath === "string" ? metadata.githubPath : null,
  };
}

async function audit(input: { actorId: string; action: string; entityId: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({ data: { actorId: input.actorId, action: input.action, entityType: "BackupJob", entityId: input.entityId, metadata: input.metadata } });
}

export async function restoreWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");
  let restoreJobId: string | null = null;

  try {
    const artifact = await getArtifact(backupJobId);
    const service = createRestoreService();
    const available = await service.ensureBackupAvailable({ backupId: artifact.artifactId, backupRoot: artifact.backupRoot, type: artifact.job.type, githubToken: env.BACKUP_GITHUB_TOKEN, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY, githubBranch: artifact.branch });
    const validation = await service.validateBackup({ backupId: artifact.artifactId, backupRoot: artifact.backupRoot });

    if (!validation.valid) {
      await audit({ actorId: session.user.id, action: "RESTORE_REJECTED", entityId: backupJobId, metadata: { source: available.source, errors: validation.validation.errors } });
      throw new Error(validation.validation.errors.join("; ") || "فشل التحقق قبل الاستعادة.");
    }

    const restoreJob = await prisma.$transaction(async (tx) => {
      const activeRestoreCount = await tx.restoreJob.count({ where: { status: { in: ["PENDING", "RUNNING"] } } });
      if (activeRestoreCount > 0) throw new Error("توجد عملية استعادة أخرى قيد التنفيذ.");
      return tx.restoreJob.create({ data: { backupJobId, status: "RUNNING", triggeredById: session.user.id }, select: { id: true } });
    }, { isolationLevel: "Serializable" });
    restoreJobId = restoreJob.id;

    await audit({ actorId: session.user.id, action: "RESTORE_STARTED", entityId: backupJobId, metadata: { restoreJobId, source: available.source } });

    const result = await service.executeRestore({ backupId: artifact.artifactId, backupRoot: artifact.backupRoot, databaseUrl: env.DATABASE_URL, type: artifact.job.type, githubToken: env.BACKUP_GITHUB_TOKEN, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY, githubBranch: artifact.branch });
    if (!result.success) throw new Error(result.errors.join("; ") || "فشلت الاستعادة.");

    const postValidation = await service.validatePostRestore(env.DATABASE_URL);
    if (!postValidation.passed) throw new Error(postValidation.errors.join("; ") || "فشل التحقق بعد الاستعادة.");

    await prisma.restoreJob.update({ where: { id: restoreJob.id }, data: { status: "COMPLETED", completedAt: new Date() } });
    await audit({ actorId: session.user.id, action: "RESTORE_COMPLETED", entityId: backupJobId, metadata: { restoreJobId, source: result.source, durationMs: result.durationMs, counts: postValidation.counts } });
    revalidatePath("/admin/backups");
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت الاستعادة.";
    if (restoreJobId) {
      await prisma.restoreJob.update({ where: { id: restoreJobId }, data: { status: "FAILED", errorMessage: message, completedAt: new Date() } }).catch(() => undefined);
      await audit({ actorId: session.user.id, action: "RESTORE_FAILED", entityId: backupJobId, metadata: { restoreJobId, error: message } }).catch(() => undefined);
    }
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "restoreWorkspaceBackup", backupJobId } });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/admin/backups?restored=1");
}

export async function verifyWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");
  let valid = false;

  try {
    const artifact = await getArtifact(backupJobId);
    const service = createRestoreService();
    const available = await service.ensureBackupAvailable({ backupId: artifact.artifactId, backupRoot: artifact.backupRoot, type: artifact.job.type, githubToken: env.BACKUP_GITHUB_TOKEN, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY, githubBranch: artifact.branch });
    const result = await createVerificationService().verifyBackup(artifact.artifactId, artifact.backupRoot);
    valid = result.valid;
    await audit({ actorId: session.user.id, action: valid ? "BACKUP_VERIFIED" : "BACKUP_VERIFICATION_FAILED", entityId: backupJobId, metadata: { source: available.source, errors: result.errors, durationMs: result.durationMs } });
    revalidatePath("/admin/backups");
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "verifyWorkspaceBackup", backupJobId } });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  redirect(`/admin/backups?verified=${valid ? "1" : "0"}`);
}

export async function deleteWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");

  try {
    const artifact = await getArtifact(backupJobId);
    const github = createGitHubStorage(env.BACKUP_GITHUB_TOKEN, process.env.BACKUP_GITHUB_REPOSITORY);
    if (!github) throw new Error("لا يمكن حذف نسخة مكتملة بدون الاتصال بمخزن GitHub الرسمي.");
    await github.deleteBackup(artifact.artifactId, artifact.branch);
    if (existsSync(artifact.backupDir)) await rm(artifact.backupDir, { recursive: true, force: true });
    await audit({ actorId: session.user.id, action: "BACKUP_DELETED", entityId: backupJobId, metadata: { branch: artifact.branch, githubPath: artifact.githubPath } });
    await prisma.restoreJob.deleteMany({ where: { backupJobId } });
    await prisma.backupJob.delete({ where: { id: backupJobId } });
    revalidatePath("/admin/backups");
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "deleteWorkspaceBackup", backupJobId } });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/admin/backups?deleted=1");
}
