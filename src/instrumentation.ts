export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startProductionBackupRunner } = await import(
    "@/modules/backups/production-backup-runner"
  );
  startProductionBackupRunner();
}
