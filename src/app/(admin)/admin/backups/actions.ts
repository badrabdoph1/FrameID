"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { join } from "node:path";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createRestoreService } from "@/modules/backups/backup-restore-service";
import { env } from "@/lib/env";
import type { BackupType } from "@/modules/backups/backup-manifest";
import { listBackupDirs } from "@/modules/backups/local-backup-artifact-writer";

export async function runBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const type = formData.get("type");

  if (type !== "DATABASE" && type !== "UPLOADS" && type !== "FULL") {
    redirect("/admin/backups?error=invalid-type");
  }

  const databaseUrl = env.DATABASE_URL;

  try {
    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl,
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      backupGitHubToken: env.BACKUP_GITHUB_TOKEN,
      backupEncryptionKey: env.BACKUP_ENCRYPTION_KEY,
    });

    await service.runManualBackup({
      type: type as BackupType,
      initiatedById: session.user.id,
      note: "نسخة يدوية من مركز النسخ الاحتياطي",
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "runBackup", type },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/backups");
  redirect("/admin/backups?started=1");
}

export async function restoreBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const backupId = formData.get("backupId") as string;
  const type = formData.get("type") as string;

  if (!backupId) {
    redirect("/admin/backups?error=missing-backup-id");
  }

  if (type !== "DATABASE" && type !== "UPLOADS" && type !== "FULL") {
    redirect("/admin/backups?error=invalid-type");
  }

  const databaseUrl = env.DATABASE_URL;
  const backupRoot = join(process.cwd(), "backups");

  try {
    const restoreService = createRestoreService();

    const validation = await restoreService.validateBackup({
      backupId,
      backupRoot,
    });

      await (prisma as unknown as { restoreJob: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> } }).restoreJob.create({
        data: {
          backupId,
          type: type as BackupType,
          status: validation.valid ? "VALIDATED" : "VALIDATION_FAILED",
          initiatedById: session.user.id,
          manifest: validation.manifest,
          validationJson: validation.validation,
        },
      });

    if (!validation.valid) {
      redirect("/admin/backups?error=restore-validation-failed");
    }

    const result = await restoreService.executeRestore({
      backupId,
      backupRoot,
      databaseUrl,
      type: type as BackupType,
    });

    await (prisma as unknown as { restoreJob: { updateMany: (args: { where: Record<string, unknown>, data: Record<string, unknown> }) => Promise<unknown> } }).restoreJob.updateMany({
        where: { backupId, status: "VALIDATED" },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          resultJson: result,
          errorMessage: result.errors.join("; ") || null,
          completedAt: new Date(),
        },
      });

    if (!result.success) {
      redirect(
        `/admin/backups?error=restore-failed&details=${encodeURIComponent(
          result.errors.join("; ")
        )}`
      );
    }

    const postValidation = await restoreService.validatePostRestore(databaseUrl);
    await (prisma as unknown as { restoreJob: { updateMany: (args: { where: Record<string, unknown>, data: Record<string, unknown> }) => Promise<unknown> } }).restoreJob.updateMany({
        where: { backupId, status: "COMPLETED" },
        data: {
          postValidationJson: postValidation,
        },
      });

    revalidatePath("/admin/backups");
    redirect(
      `/admin/backups?restored=1&backup=${encodeURIComponent(backupId)}`
    );
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "restoreBackup", backupId, type },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function listLocalBackupsAction() {
  await requireSuperAdminSession();
  const dirs = await listBackupDirs();
  return dirs.map((dir) => {
    const parts = dir.split("_");
    const datePart = parts[0];
    return {
      id: dir,
      date: datePart,
      display: dir,
    };
  });
}
