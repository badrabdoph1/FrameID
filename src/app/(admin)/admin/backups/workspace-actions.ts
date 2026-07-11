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
  if (job.status !== "COMPLETED") throw new Error("لا يمكن استخدام نسخة غير مكتملة.");
  if (!job.filePath) throw new Error("ملف النسخة غير متاح.");

  const expectedRoot = resolve(process.cwd(), "backups");
  const backupDir = resolve(job.filePath);
  if (!backupDir.startsWith(`${expectedRoot}/`)) throw new Error("مسار النسخة غير صالح.");

  return { job, backupDir, backupRoot: dirname(backupDir), artifactId: basename(backupDir) };
}

async function audit(input: {
  actorId: string;
  action: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: "BackupJob",
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

export async function restoreWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");
  let restoreJobId: string | null = null;

  try {
    const artifact = await getArtifact(backupJobId);
    if (!isSupportedBackupType(artifact.job.type)) throw new Error("نوع النسخة غير مدعوم.");

    const service = createRestoreService();
    const validation = await service.validateBackup({
      backupId: artifact.artifactId,
      backupRoot: artifact.backupRoot,
    });

    if (!validation.valid) {
      await audit({
        actorId: session.user.id,
        action: "RESTORE_REJECTED",
        entityId: backupJobId,
        metadata: { errors: validation.validation.errors },
      });
      throw new Error(validation.validation.errors.join("; ") || "فشل التحقق قبل الاستعادة.");
    }

    const restoreJob = await prisma.$transaction(async (tx) => {
      const activeRestoreCount = await tx.restoreJob.count({
        where: { status: { in: ["PENDING", "RUNNING"] } },
      });
      if (activeRestoreCount > 0) throw new Error("توجد عملية استعادة أخرى قيد التنفيذ.");

      return tx.restoreJob.create({
        data: {
          backupJobId,
          status: "RUNNING",
          triggeredById: session.user.id,
        },
        select: { id: true },
      });
    }, { isolationLevel: "Serializable" });
    restoreJobId = restoreJob.id;

    await audit({
      actorId: session.user.id,
      action: "RESTORE_STARTED",
      entityId: backupJobId,
      metadata: { restoreJobId },
    });

    const result = await service.executeRestore({
      backupId: artifact.artifactId,
      backupRoot: artifact.backupRoot,
      databaseUrl: env.DATABASE_URL,
      type: artifact.job.type,
    });

    if (!result.success) throw new Error(result.errors.join("; ") || "فشلت الاستعادة.");

    const postValidation = await service.validatePostRestore(env.DATABASE_URL);
    if (!postValidation.passed) {
      throw new Error(postValidation.errors.join("; ") || "فشل التحقق بعد الاستعادة.");
    }

    await prisma.restoreJob.update({
      where: { id: restoreJob.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await audit({
      actorId: session.user.id,
      action: "RESTORE_COMPLETED",
      entityId: backupJobId,
      metadata: { restoreJobId, durationMs: result.durationMs, counts: postValidation.counts },
    });
    revalidatePath("/admin/backups");
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشلت الاستعادة.";
    if (restoreJobId) {
      await prisma.restoreJob.update({
        where: { id: restoreJobId },
        data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
      }).catch(() => undefined);
      await audit({
        actorId: session.user.id,
        action: "RESTORE_FAILED",
        entityId: backupJobId,
        metadata: { restoreJobId, error: message },
      }).catch(() => undefined);
    }

    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "restoreWorkspaceBackup", backupJobId },
    });
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
    const result = await createVerificationService().verifyBackup(artifact.artifactId, artifact.backupRoot);
    valid = result.valid;
    await audit({
      actorId: session.user.id,
      action: valid ? "BACKUP_VERIFIED" : "BACKUP_VERIFICATION_FAILED",
      entityId: backupJobId,
      metadata: { errors: result.errors, durationMs: result.durationMs },
    });
    revalidatePath("/admin/backups");
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "verifyWorkspaceBackup", backupJobId },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  redirect(`/admin/backups?verified=${valid ? "1" : "0"}`);
}

export async function deleteWorkspaceBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupJobId = String(formData.get("backupJobId") ?? "");

  try {
    const artifact = await getArtifact(backupJobId);
    if (existsSync(artifact.backupDir)) await rm(artifact.backupDir, { recursive: true, force: true });
    await audit({ actorId: session.user.id, action: "BACKUP_DELETED", entityId: backupJobId });
    await prisma.restoreJob.deleteMany({ where: { backupJobId } });
    await prisma.backupJob.delete({ where: { id: backupJobId } });
    revalidatePath("/admin/backups");
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "deleteWorkspaceBackup", backupJobId },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/admin/backups?deleted=1");
}
