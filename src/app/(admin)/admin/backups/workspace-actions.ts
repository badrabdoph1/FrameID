"use server";

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import type { Prisma } from "@prisma/client";
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
import { createOfficialRestorePipeline } from "@/modules/backups/frameid-restore-pipeline";

async function getArtifact(backupJobId: string) {
  const job = await prisma.backupJob.findUnique({
    where: { id: backupJobId },
    select: { id: true, type: true, status: true, filePath: true, metadata: true },
  });
  if (!job) throw new Error("النسخة غير موجودة.");
  if (job.status !== "COMPLETED") throw new Error("لا يمكن استخدام نسخة غير مكتملة.");
  if (!isSupportedBackupType(job.type)) throw new Error("نوع النسخة غير مدعوم.");
  if (!job.filePath) throw new Error("معرّف ملف النسخة غير متاح.");

  const backupType = job.type;
  const expectedRoot = resolve(process.env.BACKUP_DIR || resolve(process.cwd(), "backups"));
  const backupDir = resolve(job.filePath);
  if (!backupDir.startsWith(`${expectedRoot}/`)) throw new Error("مسار النسخة غير صالح.");

  const metadata = job.metadata && typeof job.metadata === "object" && !Array.isArray(job.metadata)
    ? job.metadata as Record<string, unknown>
    : {};

  return {
    job,
    type: backupType,
    backupDir,
    backupRoot: dirname(backupDir),
    artifactId: basename(backupDir),
    branch: getGitHubBackupBranch(backupType),
    githubPath: typeof metadata.githubPath === "string" ? metadata.githubPath : null,
  };
}

async function audit(input: { actorId: string; action: string; entityId: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: "BackupJob",
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonObject | undefined,
    },
  });
}

export async function restoreWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");

  try {
    const artifact = await getArtifact(backupJobId);
    const pipeline = createOfficialRestorePipeline({ prisma: prisma as never, databaseUrl: env.DATABASE_URL, backupRoot: artifact.backupRoot, githubToken: env.BACKUP_GITHUB_TOKEN, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY });
    await pipeline.restore({ backupId: artifact.artifactId, type: artifact.type, trigger: "MANUAL", actorId: session.user.id });
    revalidatePath("/admin/backups");
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "restoreWorkspaceBackup", backupJobId } });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/admin/backups?restored=1");
}

export async function restoreLatestGitHubBackupAction() {
  const session = await requireSuperAdminSession();
  try {
    const github = createGitHubStorage(env.BACKUP_GITHUB_TOKEN, process.env.BACKUP_GITHUB_REPOSITORY);
    if (!github) throw new Error("GitHub غير مضبوط");
    const backupId = (await github.listBackups(getGitHubBackupBranch("FULL")))[0];
    if (!backupId) throw new Error("لا توجد نسخة FULL على GitHub");
    const pipeline = createOfficialRestorePipeline({ prisma: prisma as never, databaseUrl: env.DATABASE_URL, githubToken: env.BACKUP_GITHUB_TOKEN, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY });
    await pipeline.restore({ backupId, type: "FULL", trigger: "MANUAL", actorId: session.user.id });
  } catch (error) { const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "restoreLatestGitHubBackup" } }); redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`); }
  redirect("/admin/backups?restored=1");
}

export async function verifyWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");
  let valid = false;

  try {
    const artifact = await getArtifact(backupJobId);
    const service = createRestoreService();
    const available = await service.ensureBackupAvailable({ backupId: artifact.artifactId, backupRoot: artifact.backupRoot, type: artifact.type, githubToken: env.BACKUP_GITHUB_TOKEN, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY, githubBranch: artifact.branch });
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
    const hasToken = Boolean(env.BACKUP_GITHUB_TOKEN);
    if (hasToken) {
      const github = createGitHubStorage(env.BACKUP_GITHUB_TOKEN, process.env.BACKUP_GITHUB_REPOSITORY);
      if (github) await github.deleteBackup(artifact.artifactId, artifact.branch).catch(() => undefined);
    }
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
