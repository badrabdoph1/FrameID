import type { BackupType } from "./backup-manifest";
import { SUPPORTED_BACKUP_TYPES } from "@/modules/backups/backup-policy";

type SchedulerSettings = {
  type: string;
  enabled: boolean;
  schedule: string;
  retentionCount: number;
};

type SchedulerDatabaseClient = {
  backupSettings: {
    findMany(input: unknown): Promise<SchedulerSettings[]>;
  };
};

export type BackupScheduler = {
  executeScheduled(): Promise<{ executed: number; skipped: number; errors: string[] }>;
  isTimeToRun(settings: SchedulerSettings): boolean;
};

export function createBackupScheduler(
  db: SchedulerDatabaseClient,
  jobServiceFactory: (
    type: BackupType
  ) => {
    runManualBackup(input: {
      type: BackupType;
      initiatedById: string;
      note?: string;
    }): Promise<{ backupJobId: string; status: "COMPLETED"; backupId: string }>;
  }
): BackupScheduler {
  const backupTypes: BackupType[] = [...SUPPORTED_BACKUP_TYPES];

  function parseCronExpression(cronExpr: string): {
    minute: number | "*" | { every: number };
    hour: number | "*" | { every: number };
    dayOfMonth: number | "*";
    month: number | "*";
    dayOfWeek: number | "*";
  } {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 5) {
      return { minute: "*", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" };
    }
    function parseField(field: string): number | "*" | { every: number } {
      if (field === "*") return "*";
      if (field.startsWith("*/")) {
        const step = parseInt(field.slice(2), 10);
        return Number.isFinite(step) && step > 0 ? { every: step } : "*";
      }
      return parseInt(field, 10);
    }
    return {
      minute: parseField(parts[0]),
      hour: parseField(parts[1]),
      dayOfMonth: parts[2] === "*" ? "*" : parseInt(parts[2], 10),
      month: parts[3] === "*" ? "*" : parseInt(parts[3], 10),
      dayOfWeek: parts[4] === "*" ? "*" : parseInt(parts[4], 10),
    };
  }

  function matchesCronField(field: number | "*" | { every: number }, value: number): boolean {
    if (field === "*") return true;
    if (typeof field === "object" && "every" in field) return value % field.every === 0;
    return field === value;
  }

  function matchesCron(cron: ReturnType<typeof parseCronExpression>, now: Date): boolean {
    const minute = now.getUTCMinutes();
    const hour = now.getUTCHours();
    const dayOfMonth = now.getUTCDate();
    const month = now.getUTCMonth() + 1;
    const dayOfWeek = now.getUTCDay();

    if (!matchesCronField(cron.minute, minute)) return false;
    if (!matchesCronField(cron.hour, hour)) return false;
    if (cron.dayOfMonth !== "*" && cron.dayOfMonth !== dayOfMonth) return false;
    if (cron.month !== "*" && cron.month !== month) return false;
    if (cron.dayOfWeek !== "*" && cron.dayOfWeek !== dayOfWeek) return false;

    return true;
  }

  return {
    isTimeToRun(settings: SchedulerSettings): boolean {
      if (!settings.enabled) return false;
      const cron = parseCronExpression(settings.schedule);
      return matchesCron(cron, new Date());
    },

    async executeScheduled() {
      const executed: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      const settings = (await db.backupSettings.findMany({
        orderBy: { type: "asc" },
      })) as SchedulerSettings[];

      for (const type of backupTypes) {
        const setting = settings.find((s) => s.type === type);
        if (!setting || !setting.enabled) {
          skipped.push(type);
          continue;
        }

        if (!this.isTimeToRun(setting)) {
          skipped.push(type);
          continue;
        }

        try {
          const service = jobServiceFactory(type);
          await service.runManualBackup({
            type,
            initiatedById: "scheduler",
            note: "scheduled backup",
          });
          executed.push(type);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`${type}: ${msg}`);
        }
      }

      return { executed: executed.length, skipped: skipped.length, errors };
    },
  };
}
