import { getNextAutomaticRun, type SupportedBackupType } from "./backup-policy";

type ScheduleClient = {
  backupSettings: {
    updateMany(input: unknown): Promise<{ count: number }>;
    update(input: unknown): Promise<unknown>;
  };
};

export async function claimAutomaticBackupSlot(client: ScheduleClient, type: SupportedBackupType, now: Date) {
  const nextRunAt = getNextAutomaticRun(type, now);
  const result = await client.backupSettings.updateMany({
    where: { type, enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
    data: { nextRunAt },
  });
  return { claimed: result.count === 1, nextRunAt };
}

export async function markAutomaticBackupCompleted(client: ScheduleClient, type: SupportedBackupType, completedAt: Date) {
  await client.backupSettings.update({ where: { type }, data: { lastRunAt: completedAt } });
}

export async function releaseAutomaticBackupSlot(client: ScheduleClient, type: SupportedBackupType, failedAt: Date) {
  await client.backupSettings.update({ where: { type }, data: { nextRunAt: new Date(failedAt.getTime() + 15 * 60 * 1000) } });
}
