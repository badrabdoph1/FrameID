import { prisma } from "@/lib/prisma";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

const DEFAULT_INTERVAL_MS = 60_000;

function nextDailyRun(schedule: string, now: Date): Date {
  const [minuteRaw = "0", hourRaw = "2"] = schedule.trim().split(/\s+/);
  const minute = minuteRaw === "*" ? now.getUTCMinutes() : Number.parseInt(minuteRaw, 10);
  let hour: number;
  if (hourRaw === "*") {
    hour = now.getUTCHours();
  } else if (hourRaw.startsWith("*/")) {
    const step = Number.parseInt(hourRaw.slice(2), 10);
    const currentHour = now.getUTCHours();
    hour = Number.isFinite(step) && step > 0 ? Math.ceil(currentHour / step) * step : 2;
    if (hour >= 24) hour = 0;
  } else {
    hour = Number.parseInt(hourRaw, 10);
  }
  const next = new Date(now);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(Number.isFinite(minute) ? minute : 0);
  next.setUTCHours(Number.isFinite(hour) ? hour : 2);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function runDueBackups(now = new Date()): Promise<void> {
  const settings = await prisma.backupSettings.findMany({ where: { enabled: true }, orderBy: { type: "asc" } });

  for (const setting of settings) {
    if (!isSupportedBackupType(setting.type)) continue;
    const backupType = setting.type;
    if (setting.nextRunAt && setting.nextRunAt > now) continue;

    const claimed = await prisma.backupSettings.updateMany({
      where: { type: backupType, enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
      data: { nextRunAt: nextDailyRun(setting.schedule, now) },
    });
    if (claimed.count !== 1) continue;

    console.log(`[backup-runner] Running scheduled ${backupType} backup`);

    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl: process.env.DATABASE_URL ?? "",
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA,
      backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
      backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
      backupRoot: process.env.BACKUP_DIR || undefined,
    });

    const result = await service.runScheduledBackup(backupType);
    if (result) {
      await prisma.backupSettings.update({ where: { type: backupType }, data: { lastRunAt: now } });
      console.log(`[backup-runner] Scheduled ${backupType} backup completed: ${result.backupId}`);
    } else {
      console.error(`[backup-runner] Scheduled ${backupType} backup failed`);
    }
  }
}

export function startProductionBackupRunner(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.BACKUP_SCHEDULER_ENABLED === "false") return;
  if (!process.env.DATABASE_URL) return;
  if (!process.env.BACKUP_GITHUB_TOKEN) {
    console.warn("[backup-runner] BACKUP_GITHUB_TOKEN is not set. Backups will run as local-only (not uploaded to GitHub).");
  }

  const globalState = globalThis as typeof globalThis & { __frameIdBackupRunnerStarted?: boolean };
  if (globalState.__frameIdBackupRunnerStarted) return;
  globalState.__frameIdBackupRunnerStarted = true;

  console.log("[backup-runner] Starting production backup scheduler");

  const tick = () => {
    runDueBackups().catch((error) => console.error("[backup-runner] scheduled backup tick failed", error));
  };

  tick();
  const intervalMs = Number.parseInt(process.env.BACKUP_SCHEDULER_INTERVAL_MS ?? String(DEFAULT_INTERVAL_MS), 10);
  const timer = setInterval(tick, Number.isFinite(intervalMs) ? intervalMs : DEFAULT_INTERVAL_MS);
  timer.unref();
}
