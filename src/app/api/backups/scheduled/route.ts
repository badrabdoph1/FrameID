import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService, getGitHubBackupBranch } from "@/modules/backups/backup-job-service";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function log(level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, ...meta };
  if (level === "error") console.error(`[backup-scheduler] ${msg}`, entry);
  else if (level === "warn") console.warn(`[backup-scheduler] ${msg}`, entry);
  else console.log(`[backup-scheduler] ${msg}`, entry);
}

function parseCron(cronExpr: string): { minute: number | "*"; hour: number | "*"; dom: number | "*"; dow: number | "*" } {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) return { minute: 0, hour: 2, dom: "*", dow: "*" };

  function field(raw: string, def: number): number | "*" {
    if (raw === "*") return "*";
    if (raw.startsWith("*/")) return parseInt(raw.slice(2), 10) || def;
    return parseInt(raw, 10);
  }

  return {
    minute: field(parts[0], 0),
    hour: field(parts[1], 2),
    dom: field(parts[2], 1),
    dow: field(parts[4], 0),
  };
}

function shouldRunNow(schedule: string, lastRunAt: Date | null): boolean {
  const now = new Date();
  const cron = parseCron(schedule);

  if (lastRunAt) {
    const diffMs = now.getTime() - lastRunAt.getTime();
    const diffMin = diffMs / (1000 * 60);
    if (diffMin < 55) {
      log("info", "Skipping — last run was less than 55 minutes ago", { lastRunAt: lastRunAt.toISOString(), diffMin: Math.round(diffMin) });
      return false;
    }
  }

  if (cron.hour !== "*" && cron.hour !== now.getUTCHours()) return false;
  if (cron.dom !== "*" && cron.dom !== now.getUTCDate()) return false;
  if (cron.dow !== "*" && cron.dow !== now.getUTCDay()) return false;

  return true;
}

export async function GET(request: NextRequest) {
  const startedAt = new Date();
  log("info", "=== Scheduled backup check started ===");

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log("warn", "Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      log("error", "DATABASE_URL not configured");
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    if (!process.env.BACKUP_GITHUB_TOKEN) {
      log("warn", "BACKUP_GITHUB_TOKEN غير مضبوط؛ ستفشل النسخ ولن تسجل كمكتملة");
    }

    const enabledTypes = await prisma.backupSettings.findMany({
      where: { enabled: true },
      select: { type: true, schedule: true, lastRunAt: true, nextRunAt: true },
    });

    log("info", `Found ${enabledTypes.length} enabled backup types`, {
      types: enabledTypes.map((t) => ({ type: t.type, schedule: t.schedule, lastRunAt: t.lastRunAt?.toISOString() ?? "never" })),
    });

    const results: Array<{ type: string; status: string; backupId?: string; error?: string; durationMs?: number }> = [];

    for (const setting of enabledTypes) {
      if (!isSupportedBackupType(setting.type)) {
        log("warn", `Skipping unknown backup type: ${setting.type}`);
        continue;
      }

      const shouldRun = shouldRunNow(setting.schedule, setting.lastRunAt);
      if (!shouldRun) {
        results.push({ type: setting.type, status: "SKIPPED" });
        log("info", `Skipping ${setting.type} — not time to run (schedule: ${setting.schedule})`);
        continue;
      }

      log("info", `Running scheduled ${setting.type} backup (schedule: ${setting.schedule})`);
      const backupStarted = Date.now();

      try {
        const service = createBackupJobService({
          repository: createPrismaBackupJobRepository(prisma as never),
          databaseUrl,
          platformVersion: process.env.npm_package_version ?? "0.1.0",
          backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
          backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
          backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
        });

        const result = await service.runBackup({
          type: setting.type,
          trigger: "AUTO",
          initiatedById: "scheduler",
          note: `Backup auto ${new Date().toISOString()}`,
        });

        const durationMs = Date.now() - backupStarted;

        await prisma.backupSettings.update({
          where: { type: setting.type },
          data: { lastRunAt: new Date() },
        });

        log("info", `✓ ${setting.type} backup completed`, {
          backupId: result.backupId,
          backupJobId: result.backupJobId,
          durationMs,
        });

        results.push({ type: setting.type, status: "COMPLETED", backupId: result.backupId, durationMs });
      } catch (error) {
        const durationMs = Date.now() - backupStarted;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        log("error", `✗ ${setting.type} backup FAILED`, { error: errorMsg, durationMs });
        results.push({ type: setting.type, status: "FAILED", error: errorMsg, durationMs });
      }
    }

    const totalDuration = Date.now() - startedAt.getTime();
    const completed = results.filter((r) => r.status === "COMPLETED").length;
    const failed = results.filter((r) => r.status === "FAILED").length;
    const skipped = results.filter((r) => r.status === "SKIPPED").length;

    log("info", `=== Scheduled backup check finished === completed=${completed} failed=${failed} skipped=${skipped} duration=${totalDuration}ms`);

    await prisma.auditLog.create({
      data: {
        action: "BACKUP_SCHEDULER_RUN",
        entityType: "BackupScheduler",
        entityId: "scheduled-run",
        metadata: { results, totalDurationMs: totalDuration, timestamp: startedAt.toISOString() },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, results, durationMs: totalDuration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduler failed";
    log("error", `Scheduler crashed: ${message}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "Use GET to trigger scheduled backups" });
}
