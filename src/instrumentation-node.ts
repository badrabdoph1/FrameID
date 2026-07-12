import "server-only";

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { startProductionBackupRunner } from "@/modules/backups/production-backup-runner";

export function registerNodeInstrumentation(): void {
  ensureBackupDir();
  startProductionBackupRunner();
}

function ensureBackupDir(): void {
  const backupRoot = process.env.BACKUP_DIR || join(process.cwd(), "backups");
  mkdir(backupRoot, { recursive: true }).catch(() => {});
}
