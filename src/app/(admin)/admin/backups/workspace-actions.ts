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
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

async function getArtifact(backupJobId: string) {
  const job = await prisma.backupJob.findUnique({
    where: { id: backupJobId },
    select: { id: true, type: true, status: true, filePath: true },
  });
  if (!job) throw new Error("النسخة غير موجودة.");
  if (!job.filePath) throw new Error("ملف النسخة غير متاح.");

  const expectedRoot = resolve(process.cwd(), "backups");
  const backupDir = resolve(job.filePath);
  if (!backupDir.startsWith(`${expectedRoot}/`)) throw new Error("مسار النسخة غير صالح.");

  return { job, backupDir, backupRoot: dirname(backupDir), artifactId: basename(backupDir) };
}

export async function restoreWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");

  try {
    const artifact = await getArtifact(backupJobId);
    if (!isSupportedBackupType(artifact.job.type)) throw new Error("نوع النسخة غير مدعوم.");

    const service = createRestoreService();
    const validation = await service.validateBackup({
      backupId: artifact.artifactId,
      backupRoot: artifact.backupRoot,
    });
    const validationErrors = validation.validation.errors;

    const restoreJob = await prisma.restoreJob.create({
      data: {
        backupJobId,
        status: validation.valid ? "PENDING" : "FAILED",
        triggeredById: session.user.id,
        errorMessage: validation.valid ? null : validationErrors.join("; "),
      },
      select: { id: true },
    });

    if (!validation.valid) throw new Error(validationErrors.join("; ") || "فشل التحقق قبل الاستعادة.");

    const result = await service.executeRestore({
      backupId: artifact.artifactId,
      backupRoot: artifact.backupRoot,
      databaseUrl: env.DATABASE_URL,
      type: artifact.job.type,
    });

    await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        errorMessage: result.errors.join("; ") || null,
        completedAt: new Date(),
      },
    });

    if (!result.success) throw new Error(result.errors.join("; ") || "فشلت الاستعادة.");
    await service.validatePostRestore(env.DATABASE_URL);
    revalidatePath("/admin/backups");
    redirect("/admin/backups?restored=1");
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "restoreWorkspaceBackup", backupJobId },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function verifyWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");

  try {
    const artifact = await getArtifact(backupJobId);
    const result = await createVerificationService().verifyBackup(artifact.artifactId, artifact.backupRoot);
    revalidatePath("/admin/backups");
    redirect(`/admin/backups?verified=${result.valid ? "1" : "0"}`);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "verifyWorkspaceBackup", backupJobId },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function deleteWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");

  try {
    const artifact = await getArtifact(backupJobId);
    if (existsSync(artifact.backupDir)) await rm(artifact.backupDir, { recursive: true, force: true });
    await prisma.restoreJob.deleteMany({ where: { backupJobId } });
    await prisma.backupJob.delete({ where: { id: backupJobId } });
    revalidatePath("/admin/backups");
    redirect("/admin/backups?deleted=1");
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "deleteWorkspaceBackup", backupJobId },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}
