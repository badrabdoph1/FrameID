import { prisma } from "@/lib/prisma";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";
import { claimAutomaticBackupSlot, markAutomaticBackupCompleted, releaseAutomaticBackupSlot } from "@/modules/backups/automatic-backup-schedule";

const DEFAULT_INTERVAL_MS = 60_000;

function log(level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, ...meta };
  if (level === "error") console.error(`[backup-runner] ${msg}`, entry);
  else if (level === "warn") console.warn(`[backup-runner] ${msg}`, entry);
  else console.log(`[backup-runner] ${msg}`, entry);
}

export async function runDueBackups(now = new Date()): Promise<void> {
  log("info", "Checking for due backups", { now: now.toISOString() });

  const settings = await prisma.backupSettings.findMany({ where: { enabled: true }, orderBy: { type: "asc" } });

  log("info", `Found ${settings.length} enabled backup settings`, {
    settings: settings.map((s) => ({
      type: s.type,
      schedule: s.schedule,
      lastRunAt: s.lastRunAt?.toISOString() ?? "never",
      nextRunAt: s.nextRunAt?.toISOString() ?? "not set",
    })),
  });

  for (const setting of settings) {
    if (!isSupportedBackupType(setting.type)) continue;
    const backupType = setting.type;

    if (setting.nextRunAt && setting.nextRunAt > now) {
      log("info", `Skipping ${backupType} — next run at ${setting.nextRunAt.toISOString()} (not yet due)`);
      continue;
    }

    const slot = await claimAutomaticBackupSlot(prisma, backupType, now);
    if (!slot.claimed) {
      log("info", `Skipping ${backupType} — slot already claimed by another process`);
      continue;
    }

    const startedAt = Date.now();
    log("info", `Starting scheduled ${backupType} backup`, { nextRunAt: slot.nextRunAt.toISOString() });

    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl: process.env.DATABASE_URL ?? "",
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA,
      backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
      backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
      backupRoot: process.env.BACKUP_DIR || undefined,
    });

    try {
      const result = await service.runBackup({ type: backupType, trigger: "AUTO", initiatedById: "scheduler", note: "نسخة تلقائية" });
      const durationMs = Date.now() - startedAt;

      if (result) {
        await markAutomaticBackupCompleted(prisma, backupType, new Date());
        log("info", `✓ Scheduled ${backupType} backup completed`, {
          backupId: result.backupId,
          backupJobId: result.backupJobId,
          durationMs,
        });
      }
    } catch (error) {
      await releaseAutomaticBackupSlot(prisma, backupType, new Date()).catch(() => undefined);
      const durationMs = Date.now() - startedAt;
      const msg = error instanceof Error ? error.message : "Unknown error";
      log("error", `✗ Scheduled ${backupType} backup crashed`, { error: msg, durationMs });
    }
  }
}

export function startProductionBackupRunner(): void {
  if (process.env.NODE_ENV !== "production") {
    log("info", `Skipping — NODE_ENV is "${process.env.NODE_ENV}" (not production)`);
    return;
  }
  if (process.env.BACKUP_SCHEDULER_ENABLED === "false") {
    log("info", "Skipping — BACKUP_SCHEDULER_ENABLED is false");
    return;
  }
  if (!process.env.DATABASE_URL) {
    log("warn", "Skipping — DATABASE_URL not set");
    return;
  }
  if (!process.env.BACKUP_GITHUB_TOKEN) {
    log("warn", "BACKUP_GITHUB_TOKEN غير مضبوط؛ ستفشل النسخ ولن تسجل كمكتملة.");
  } else {
    log("info", "GitHub token configured — backups will be uploaded to GitHub");
  }

  const globalState = globalThis as typeof globalThis & { __frameIdBackupRunnerStarted?: boolean };
  if (globalState.__frameIdBackupRunnerStarted) {
    log("info", "Runner already started — skipping duplicate");
    return;
  }
  globalState.__frameIdBackupRunnerStarted = true;

  log("info", "=== Starting production backup scheduler ===");

  const tick = () => {
    runDueBackups().catch((error) => {
      log("error", "Backup tick crashed", { error: error instanceof Error ? error.message : String(error) });
    });
  };

  tick();
  const intervalMs = Number.parseInt(process.env.BACKUP_SCHEDULER_INTERVAL_MS ?? String(DEFAULT_INTERVAL_MS), 10);
  log("info", `Scheduler interval: ${intervalMs}ms`);
  const timer = setInterval(tick, Number.isFinite(intervalMs) ? intervalMs : DEFAULT_INTERVAL_MS);
  timer.unref();
}
