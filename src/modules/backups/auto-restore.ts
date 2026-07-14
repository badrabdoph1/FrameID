import { prisma } from "@/lib/prisma";
import { createGitHubStorage } from "./backup-storage-github";
import { getGitHubBackupBranch } from "./backup-job-service";
import { selectDisasterRecoveryBackup } from "./disaster-recovery-policy";
import { createOfficialRestorePipeline } from "./frameid-restore-pipeline";
import { createVerificationService } from "./backup-verification-service";
import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

async function checkDatabaseHasData(): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::int8 as count FROM "User"`
    );
    return Number(result[0]?.count ?? 0n) > 0;
  } catch {
    return true;
  }
}

export async function attemptAutoRestore(): Promise<{ restored: boolean; backupId?: string; error?: string }> {
  if (process.env.AUTO_RESTORE_ENABLED === "false") {
    return { restored: false };
  }

  const githubToken = process.env.BACKUP_GITHUB_TOKEN?.trim();
  if (!githubToken) {
    return { restored: false };
  }

  const hasData = await checkDatabaseHasData();
  if (hasData) {
    return { restored: false };
  }

  const repoPath = process.env.BACKUP_GITHUB_REPOSITORY?.trim();
  const storage = createGitHubStorage(githubToken, repoPath);
  if (!storage) {
    return { restored: false, error: "فشل إنشاء GitHub Storage" };
  }

  try {
    const fullBranch = process.env.BACKUP_GITHUB_FULL_BRANCH || "frameid-backups-full";
    const manifests = await storage.listBackupManifests(fullBranch);
    if (manifests.length === 0) {
      return { restored: false, error: "لا توجد نسخ احتياطية كاملة في GitHub" };
    }

    const candidates = manifests.map((m) => ({
      backupId: m.backupId,
      usersCount: m.manifest.usersCount,
      tenantsCount: m.manifest.tenantsCount,
      sitesCount: m.manifest.sitesCount,
      mediaFilesCount: m.manifest.mediaFilesCount,
    }));

    const best = selectDisasterRecoveryBackup(candidates);
    if (!best) {
      return { restored: false, error: "لا توجد نسخة احتياطية مناسبة للاستعادة" };
    }

    const pipeline = createOfficialRestorePipeline({
      prisma: prisma as never,
      databaseUrl: process.env.DATABASE_URL ?? "",
      backupRoot: process.env.BACKUP_DIR,
      uploadsDir: process.env.UPLOADS_DIR || join(process.cwd(), "public", "uploads"),
      githubToken,
      githubRepository: repoPath,
    });

    await pipeline.restore({
      backupId: best.backupId,
      type: "FULL",
      trigger: "AUTO",
    });

    return { restored: true, backupId: best.backupId };
  } catch (error) {
    return {
      restored: false,
      error: error instanceof Error ? error.message : "فشل الاستعادة التلقائية",
    };
  }
}
