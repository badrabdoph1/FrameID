import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { isSupportedBackupType, type SupportedBackupType } from "@/modules/backups/backup-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function getScheduledTypes(): Promise<SupportedBackupType[]> {
  try {
    const settings = await prisma.backupSettings.findMany({
      where: { enabled: true },
      select: { type: true },
    });
    return settings.map((s) => s.type).filter(isSupportedBackupType);
  } catch {
    return ["DATABASE"];
  }
}

async function shouldRunNow(type: SupportedBackupType): Promise<boolean> {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDay();

  try {
    const setting = await prisma.backupSettings.findUnique({
      where: { type },
      select: { schedule: true, lastRunAt: true },
    });

    if (!setting || !setting.schedule) return false;

    if (setting.lastRunAt) {
      const hoursSinceLastRun =
        (now.getTime() - setting.lastRunAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastRun < 23) return false;
    }

    const [, hour, , , dayOfWeek] = setting.schedule.split(" ");

    if (hour !== "*") {
      const scheduledHour = parseInt(hour, 10);
      if (currentHour !== scheduledHour) return false;
    }

    if (dayOfWeek !== "*") {
      const scheduledDay = parseInt(dayOfWeek, 10);
      if (currentDay !== scheduledDay) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const types = await getScheduledTypes();
    const results: Array<{
      type: string;
      status: string;
      backupId?: string;
      error?: string;
    }> = [];

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    for (const type of types) {
      if (!(await shouldRunNow(type))) {
        results.push({ type, status: "SKIPPED" });
        continue;
      }

      try {
        const service = createBackupJobService({
          repository: createPrismaBackupJobRepository(prisma as never),
          databaseUrl,
          platformVersion: process.env.npm_package_version ?? "0.1.0",
          backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
          backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
        });

        const result = await service.runManualBackup({
          type,
          initiatedById: "scheduler",
          note: "Scheduled automated backup",
        });

        results.push({
          type,
          status: "COMPLETED",
          backupId: result.backupId,
        });
      } catch (error) {
        results.push({
          type,
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: "Use GET to trigger scheduled backups",
  });
}
