import "server-only";

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { startProductionBackupRunner } from "@/modules/backups/production-backup-runner";

export function registerNodeInstrumentation(): void {
  ensureBackupDir();
  startProductionBackupRunner();
  attemptAutoRestoreOnStartup();
}

function ensureBackupDir(): void {
  const backupRoot = process.env.BACKUP_DIR || join(process.cwd(), "backups");
  mkdir(backupRoot, { recursive: true }).catch(() => {});
}

function attemptAutoRestoreOnStartup(): void {
  import("@/modules/backups/auto-restore").then(({ attemptAutoRestore }) => {
    attemptAutoRestore()
      .then((result) => {
        if (result.restored) {
          console.log(`[auto-restore] ✓ تمت استعادة قاعدة البيانات تلقائيًا من النسخة: ${result.backupId}`);
        } else if (result.error) {
          console.warn(`[auto-restore] لم تتم الاستعادة التلقائية: ${result.error}`);
        }
      })
      .catch((error) => {
        console.error(`[auto-restore] فشلت الاستعادة التلقائية: ${error instanceof Error ? error.message : String(error)}`);
      });
  });
}
