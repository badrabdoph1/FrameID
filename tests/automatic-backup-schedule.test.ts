import { describe, expect, it } from "vitest";

import { claimAutomaticBackupSlot, markAutomaticBackupCompleted, releaseAutomaticBackupSlot } from "@/modules/backups/automatic-backup-schedule";

describe("منسق النسخ التلقائي", () => {
  it("يحجز موعد FULL التالي بعد 48 ساعة بعملية ذرية", async () => {
    const calls: unknown[] = [];
    const client = { backupSettings: { updateMany: async (input: unknown) => { calls.push(input); return { count: 1 }; }, update: async () => ({}) } };
    const now = new Date("2026-07-31T03:00:00.000Z");
    expect(await claimAutomaticBackupSlot(client, "FULL", now)).toEqual({ claimed: true, nextRunAt: new Date("2026-08-02T03:00:00.000Z") });
    expect(calls[0]).toMatchObject({ data: { nextRunAt: new Date("2026-08-02T03:00:00.000Z") } });
  });

  it("يسجل النجاح ويعيد المحاولة بعد الفشل دون انتظار الفترة كلها", async () => {
    const updates: unknown[] = [];
    const client = { backupSettings: { updateMany: async () => ({ count: 0 }), update: async (input: unknown) => { updates.push(input); return {}; } } };
    const now = new Date("2026-07-13T03:00:00.000Z");
    await markAutomaticBackupCompleted(client, "DATABASE", now);
    await releaseAutomaticBackupSlot(client, "FULL", now);
    expect(updates).toEqual([
      { where: { type: "DATABASE" }, data: { lastRunAt: now } },
      { where: { type: "FULL" }, data: { nextRunAt: new Date("2026-07-13T03:15:00.000Z") } },
    ]);
  });
});
