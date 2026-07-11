import { prisma } from "@/lib/prisma";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

const DEFAULT_INTERVAL_MS = 60_000;

function nextDailyRun(schedule: string, now: Date): Date {
  const [minuteRaw = "0", hourRaw = "2"] = schedule.trim().split(/\s+/);
  const minute = minuteRaw === "*" ? now.getUTCMinutes() : Number.parseInt(minuteRaw, 10);
  const hour = hourRaw === "*" ? now.getUTCHours() : Number.parseInt(hourRaw, 10);
  const next = new Date(now);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(Number.isFinite(minute) ? minute : 0);
  next.setUTCHours(Number.isFinite(hour) ? hour : 2);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function runDueBackups(now = new Date()): Promise<void> {
  const settings = await prisma.backupSettings.findMany({
    where: { enabled: true },
    orderBy: { type: "asc" },
  });

  for (const setting of settings) {
    if (!isSupportedBackupType(setting.type)) continue;
    if (setting.nextRunAt && setting.nextRunAt > now) continue;

    const claimed = await prisma.backupSettings.updateMany({
      where: {
        type: setting.type,
        enabled: true,
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
      data: { nextRunAt: nextDailyRun(setting.schedule, now) },
    });
    if (claimed.count !== 1) continue;

    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl: process.env.DATABASE_URL ?? "",
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA,
      backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    });

    const result = await service.runScheduledBackup(setting.type);
    if (result) {
      await prisma.backupSettings.update({
        where: { type: setting.type },
        data: { lastRunAt: now },
      });
    }
  }
}

export function startProductionBackupRunner(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.BACKUP_SCHEDULER_ENABLED === "false") return;
  if (!process.env.DATABASE_URL) return;

  const globalState = globalThis as typeof globalThis & {
    __frameIdBackupRunnerStarted?: boolean;
  };
  if (globalState.__frameIdBackupRunnerStarted) return;
  globalState.__frameIdBackupRunnerStarted = true;

  const tick = () => {
    runDueBackups().catch((error) => {
      console.error("[backup-runner] scheduled backup tick failed", error);
    });
  };

  tick();
  const intervalMs = Number.parseInt(
    process.env.BACKUP_SCHEDULER_INTERVAL_MS ?? String(DEFAULT_INTERVAL_MS),
    10
  );
  const timer = setInterval(tick, Number.isFinite(intervalMs) ? intervalMs : DEFAULT_INTERVAL_MS);
  timer.unref();
}
