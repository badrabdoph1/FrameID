"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { join } from "node:path";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createRestoreService } from "@/modules/backups/backup-restore-service";
import { createVerificationService } from "@/modules/backups/backup-verification-service";
import { createAutoRestoreService } from "@/modules/backups/backup-auto-restore-service";
import { createSnapshotService } from "@/modules/backups/backup-snapshot-service";
import { env } from "@/lib/env";
import type { BackupType } from "@/modules/backups/backup-manifest";
import { listBackupDirs } from "@/modules/backups/local-backup-artifact-writer";
import { getBackupPolicy, isSupportedBackupType } from "@/modules/backups/backup-policy";

function readBackupType(value: FormDataEntryValue | null): BackupType | null {
  return isSupportedBackupType(value) ? value : null;
}

export async function runBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const type = readBackupType(formData.get("type"));

  if (!type) redirect("/admin/backups?error=invalid-type");

  const databaseUrl = env.DATABASE_URL;

  try {
    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl,
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      backupGitHubToken: env.BACKUP_GITHUB_TOKEN,
      backupEncryptionKey: env.BACKUP_ENCRYPTION_KEY ?? undefined,
    });

    await service.runManualBackup({
      type,
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
  const type = readBackupType(formData.get("type"));

  if (!backupId) redirect("/admin/backups?error=missing-backup-id");
  if (!type) redirect("/admin/backups?error=invalid-type");

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
        backupJobId: backupId,
        status: validation.valid ? "PENDING" : "FAILED",
        triggeredById: session.user.id,
        errorMessage: validation.valid ? null : "Validation failed",
      },
    });

    if (!validation.valid) redirect("/admin/backups?error=restore-validation-failed");

    const result = await restoreService.executeRestore({
      backupId,
      backupRoot,
      databaseUrl,
      type,
    });

    await (prisma as unknown as { restoreJob: { updateMany: (args: { where: Record<string, unknown>, data: Record<string, unknown> }) => Promise<unknown> } }).restoreJob.updateMany({
      where: { backupJobId: backupId, status: "PENDING" },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        errorMessage: result.errors.join("; ") || null,
        completedAt: new Date(),
      },
    });

    if (!result.success) {
      redirect(`/admin/backups?error=restore-failed&details=${encodeURIComponent(result.errors.join("; "))}`);
    }

    const postValidation = await restoreService.validatePostRestore(databaseUrl);
    await (prisma as unknown as { restoreJob: { updateMany: (args: { where: Record<string, unknown>, data: Record<string, unknown> }) => Promise<unknown> } }).restoreJob.updateMany({
      where: { backupId, status: "COMPLETED" },
      data: { postValidationJson: postValidation },
    });

    revalidatePath("/admin/backups");
    redirect(`/admin/backups?restored=1&backup=${encodeURIComponent(backupId)}`);
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
    return { id: dir, date: datePart, display: dir };
  });
}

export async function verifyBackupAction(formData: FormData) {
  await requireSuperAdminSession();
  const backupId = formData.get("backupId") as string;
  const backupRoot = join(process.cwd(), "backups");
  const verification = createVerificationService();
  const result = await verification.verifyBackup(backupId, backupRoot);
  revalidatePath("/admin/backups");
  redirect(`/admin/backups?verified=${result.valid ? "1" : "0"}&backup=${encodeURIComponent(backupId)}`);
}

export async function verifyAllBackupsAction() {
  await requireSuperAdminSession();
  const backupRoot = join(process.cwd(), "backups");
  const verification = createVerificationService();
  const result = await verification.verifyAllBackups(backupRoot);
  revalidatePath("/admin/backups");
  redirect(`/admin/backups?verified-all=1&valid=${result.valid}&invalid=${result.invalid}`);
}

export async function deleteBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const backupId = formData.get("backupId") as string;
  const backupRoot = join(process.cwd(), "backups");
  const backupDir = join(backupRoot, backupId);

  try {
    if (existsSync(backupDir)) await rm(backupDir, { recursive: true, force: true });
    revalidatePath("/admin/backups");
    redirect(`/admin/backups?deleted=1&backup=${encodeURIComponent(backupId)}`);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "deleteBackup", backupId },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function createSnapshotAction() {
  const session = await requireSuperAdminSession();
  const databaseUrl = env.DATABASE_URL;

  try {
    const snapshot = createSnapshotService();
    const result = await snapshot.createSnapshot({
      reason: "manual-migration-package",
      databaseUrl,
      uploadsDir: join(process.cwd(), "public", "uploads"),
      contentDir: join(process.cwd(), "content"),
      backupRoot: join(process.cwd(), "backups"),
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      initiatedById: session.user.id,
    });

    revalidatePath("/admin/backups");
    if (result.success) {
      redirect(`/admin/backups?snapshot=1&backup=${encodeURIComponent(result.backupId)}`);
    } else {
      redirect(`/admin/backups?error=snapshot-failed&details=${encodeURIComponent(result.error || "")}`);
    }
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "createSnapshot" },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function checkAutoRestoreAction() {
  const session = await requireSuperAdminSession();
  const databaseUrl = env.DATABASE_URL;

  try {
    const autoRestore = createAutoRestoreService();
    const result = await autoRestore.checkAndRestore({
      databaseUrl,
      backupRoot: join(process.cwd(), "backups"),
      uploadsDir: join(process.cwd(), "public", "uploads"),
      contentDir: join(process.cwd(), "content"),
    });

    revalidatePath("/admin/backups");
    if (result.restored) redirect("/admin/backups?auto-restored=1");
    redirect(`/admin/backups?auto-restore-check=1&needed=${result.needed ? "1" : "0"}`);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "checkAutoRestore" },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function updateBackupSettingsAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const type = readBackupType(formData.get("type"));
  const enabled = formData.get("enabled") === "true";
  const schedule = (formData.get("schedule") as string) || "";
  const retentionCount = parseInt(formData.get("retentionCount") as string, 10);

  if (!type) redirect("/admin/backups?error=invalid-type");

  const policy = getBackupPolicy(type);

  try {
    await prisma.backupSettings.upsert({
      where: { type },
      update: {
        enabled,
        schedule: schedule || policy.schedule,
        retentionCount: Number.isFinite(retentionCount) ? retentionCount : policy.retentionCount,
      },
      create: {
        type,
        enabled,
        schedule: schedule || policy.schedule,
        retentionCount: Number.isFinite(retentionCount) ? retentionCount : policy.retentionCount,
      },
    });

    revalidatePath("/admin/backups");
    redirect("/admin/backups?settings-updated=1");
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "updateBackupSettings", type },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}
