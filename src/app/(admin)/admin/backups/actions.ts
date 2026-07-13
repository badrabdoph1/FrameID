"use server";

import { basename, resolve } from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBackupJobService, getGitHubBackupBranch } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createRestoreService } from "@/modules/backups/backup-restore-service";
import { createVerificationService } from "@/modules/backups/backup-verification-service";
import type { BackupType } from "@/modules/backups/backup-manifest";
import { getBackupPolicy, isSupportedBackupType } from "@/modules/backups/backup-policy";
import { reconcileProductionGitHubBackupCatalog } from "@/modules/backups/production-github-backup-catalog";

function readBackupType(value: FormDataEntryValue | null): BackupType | null {
  return isSupportedBackupType(value) ? value : null;
}

function createOfficialBackupService() {
  return createBackupJobService({
    repository: createPrismaBackupJobRepository(prisma as never),
    databaseUrl: env.DATABASE_URL,
    platformVersion: process.env.npm_package_version ?? "0.1.0",
    backupGitHubToken: env.BACKUP_GITHUB_TOKEN,
    backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
    gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA,
  });
}

export async function runBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const type = readBackupType(formData.get("type"));
  if (!type) redirect("/admin/backups?error=invalid-type");

  let completedJobId = "";
  try {
    const result = await createOfficialBackupService().runBackup({
      type,
      trigger: "MANUAL",
      initiatedById: session.user.id,
      note: type === "FULL" ? "نسخة كاملة عبر المسار الرسمي" : "نسخة قاعدة بيانات عبر المسار الرسمي",
    });
    completedJobId = result.backupJobId;
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "runBackup", type },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/backups");
  redirect(`/admin/backups?job=${encodeURIComponent(completedJobId)}`);
}


export async function verifyAllBackupsAction() {
  const session = await requireSuperAdminSession();
  const backupRoot = resolve(process.env.BACKUP_DIR || resolve(process.cwd(), "backups"));
  const restoreService = createRestoreService();
  const verification = createVerificationService();

  try {
    const jobs = await prisma.backupJob.findMany({
      where: { status: "COMPLETED", type: { in: ["DATABASE", "FULL"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, filePath: true },
    });

    let valid = 0;
    let invalid = 0;

    for (const job of jobs) {
      if (!job.filePath || !isSupportedBackupType(job.type)) {
        invalid += 1;
        continue;
      }

      const backupId = basename(job.filePath);
      try {
        await restoreService.ensureBackupAvailable({
          backupId,
          backupRoot,
          type: job.type,
          githubToken: env.BACKUP_GITHUB_TOKEN,
          githubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
          githubBranch: getGitHubBackupBranch(job.type),
        });
        const result = await verification.verifyBackup(backupId, backupRoot);
        if (result.valid) valid += 1;
        else invalid += 1;
      } catch {
        invalid += 1;
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "BACKUP_VERIFY_ALL_COMPLETED",
        entityType: "BackupJob",
        entityId: "all",
        metadata: { total: jobs.length, valid, invalid, source: "github-or-local-verified" },
      },
    });

    revalidatePath("/admin/backups");
    redirect(`/admin/backups?verified=1&valid=${valid}&invalid=${invalid}`);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "verifyAllBackups" },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function prepareMigrationBackupAction() {
  const session = await requireSuperAdminSession();
  let completedJobId = "";
  try {
    const result = await createOfficialBackupService().runBackup({
      type: "FULL",
      trigger: "MIGRATION",
      initiatedById: session.user.id,
      note: "ذهاب طوارئ عبر النسخة الكاملة الرسمية",
    });
    completedJobId = result.backupJobId;
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "prepareMigrationBackup" },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/backups");
  redirect(`/admin/backups?job=${encodeURIComponent(completedJobId)}&migration-ready=1`);
}


export async function updateBackupSettingsAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const type = readBackupType(formData.get("type"));
  const enabled = formData.get("enabled") === "true";
  if (!type) redirect("/admin/backups?error=invalid-type");

  const policy = getBackupPolicy(type);

  try {
    await prisma.backupSettings.upsert({
      where: { type },
      update: {
        enabled,
        schedule: policy.schedule,
        retentionCount: policy.retentionCount,
      },
      create: {
        type,
        enabled,
        schedule: policy.schedule,
        retentionCount: policy.retentionCount,
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

export async function rebuildFromGitHubAction() {
  const session = await requireSuperAdminSession();
  try {
    const result = await reconcileProductionGitHubBackupCatalog();
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "BACKUP_REINDEXED_FROM_GITHUB",
        entityType: "BackupJob",
        entityId: "manual-rebuild",
        metadata: { indexed: result.indexed, database: result.database, full: result.full, source: "manual-rebuild" },
      },
    });
    revalidatePath("/admin/backups");
    redirect(`/admin/backups?rebuilt=1&indexed=${result.indexed}`);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "rebuildFromGitHub" },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }
}
