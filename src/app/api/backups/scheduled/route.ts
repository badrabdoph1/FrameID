import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    if (!process.env.BACKUP_GITHUB_TOKEN) {
      return NextResponse.json({ error: "BACKUP_GITHUB_TOKEN not configured" }, { status: 500 });
    }

    const enabledTypes = await prisma.backupSettings.findMany({
      where: { enabled: true },
      select: { type: true, schedule: true, lastRunAt: true },
    });

    const results: Array<{ type: string; status: string; backupId?: string; error?: string }> = [];

    for (const setting of enabledTypes) {
      if (!isSupportedBackupType(setting.type)) continue;

      const shouldRun = shouldRunScheduledBackup(setting.schedule, setting.lastRunAt);
      if (!shouldRun) {
        results.push({ type: setting.type, status: "SKIPPED" });
        continue;
      }

      try {
        const service = createBackupJobService({
          repository: createPrismaBackupJobRepository(prisma as never),
          databaseUrl,
          platformVersion: process.env.npm_package_version ?? "0.1.0",
          backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
          backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
          backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
        });

        const result = await service.runManualBackup({
          type: setting.type,
          initiatedById: "scheduler",
          note: "Scheduled automated backup",
        });

        await prisma.backupSettings.update({
          where: { type: setting.type },
          data: { lastRunAt: new Date() },
        });

        results.push({ type: setting.type, status: "COMPLETED", backupId: result.backupId });
      } catch (error) {
        results.push({ type: setting.type, status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function shouldRunScheduledBackup(schedule: string, lastRunAt: Date | null): boolean {
  const now = new Date();
  if (lastRunAt) {
    const hoursSinceLastRun = (now.getTime() - lastRunAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRun < 23) return false;
  }

  try {
    const parts = schedule.trim().split(/\s+/);
    if (parts.length < 5) return true;
    const [, hourStr, , , dowStr] = parts;
    if (hourStr !== "*") {
      const scheduledHour = parseInt(hourStr, 10);
      if (now.getUTCHours() !== scheduledHour) return false;
    }
    if (dowStr !== "*") {
      const scheduledDay = parseInt(dowStr, 10);
      if (now.getUTCDay() !== scheduledDay) return false;
    }
    return true;
  } catch {
    return true;
  }
}

export async function POST() {
  return NextResponse.json({ message: "Use GET to trigger scheduled backups" });
}
