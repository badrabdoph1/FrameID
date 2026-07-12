import "server-only";

import { startProductionBackupRunner } from "@/modules/backups/production-backup-runner";
import { createAutoRestoreService } from "@/modules/backups/backup-auto-restore-service";

export function registerNodeInstrumentation(): void {
  startProductionBackupRunner();
  runAutoRestore();
}

async function runAutoRestore(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.DATABASE_URL) return;
  if (!process.env.BACKUP_GITHUB_TOKEN || !process.env.BACKUP_GITHUB_REPOSITORY) return;

  try {
    const service = createAutoRestoreService();
    const result = await service.checkAndRestore({ databaseUrl: process.env.DATABASE_URL });
    if (result.restored) {
      console.log(`[auto-restore] ${result.reason}`);
    } else if (result.needed) {
      console.warn(`[auto-restore] ${result.reason}`);
    }
  } catch (error) {
    console.error("[auto-restore] Auto-restore check failed:", error);
  }
}
