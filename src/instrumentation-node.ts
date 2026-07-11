import "server-only";

import { startProductionBackupRunner } from "@/modules/backups/production-backup-runner";

export function registerNodeInstrumentation(): void {
  startProductionBackupRunner();
}
