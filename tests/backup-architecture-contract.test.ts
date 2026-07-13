import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { BACKUP_POLICY, SUPPORTED_BACKUP_TYPES, getNextAutomaticRun } from "@/modules/backups/backup-policy";
describe("عقد Backup Architecture", () => {
  it("يثبت السياسة", () => { expect(SUPPORTED_BACKUP_TYPES).toEqual(["DATABASE", "FULL"]); expect(BACKUP_POLICY).toEqual({ DATABASE: { schedule: "كل 12 ساعة", intervalHours: 12, retentionCount: 20 }, FULL: { schedule: "كل 48 ساعة", intervalHours: 48, retentionCount: 10 } }); });
  it("يحسب 12 و48 ساعة كفترة ثابتة حتى عند نهاية الشهر", () => {
    const start = new Date("2026-07-31T03:00:00.000Z");
    expect(getNextAutomaticRun("DATABASE", start).toISOString()).toBe("2026-07-31T15:00:00.000Z");
    expect(getNextAutomaticRun("FULL", start).toISOString()).toBe("2026-08-02T03:00:00.000Z");
  });
  it("يثبت نفس السياسة داخل seed الإنتاج", async () => {
    const text = await readFile("prisma/seed.ts", "utf8");
    expect(text).toContain('schedule: "كل 12 ساعة", retentionCount: 20');
    expect(text).toContain('schedule: "كل 48 ساعة", retentionCount: 10');
    expect(text).not.toContain('schedule: "0 3 */3 * *"');
    expect(text).toContain("!hasCustomerData ? { nextRunAt: setting.nextRunAt } : {}");
  });
  it("يجعل Actions مشغلاً فقط", async () => { const text = await readFile(".github/workflows/backup.yml", "utf8"); expect(text).not.toMatch(/pg_dump|pg_restore|git\s+push|checksum|retention|npm run backup/i); expect(text).toContain("/api/backups/run"); });
  it("يجعل تشغيل FULL اليومي مجرد نبض ويترك قرار 48 ساعة للمنسق المشترك", async () => {
    const text = await readFile(".github/workflows/backup.yml", "utf8");
    expect(text).toContain('cron: "0 3 * * *"');
    expect(text).toContain('X-FrameID-Backup-Mode: ${BACKUP_MODE}');
  });
  it("يوثق هوية GitHub Actions عبر OIDC دون أسرار يدوية", async () => {
    const text = await readFile(".github/workflows/backup.yml", "utf8");
    expect(text).toContain("id-token: write");
    expect(text).toContain("ACTIONS_ID_TOKEN_REQUEST_URL");
    expect(text).toContain("audience=frameid-backup");
    expect(text).not.toContain("secrets.FRAMEID_BACKUP");
  });
  it("يحذف مسارات النسخ والتخزين المحلي القديمة", async () => {
    const removed = [
      "src/modules/backups/backup-content-packager.ts",
      "src/modules/backups/backup-encryption.ts",
      "src/modules/backups/backup-locks.ts",
      "src/modules/backups/storage/local-storage-provider.ts",
      "src/modules/backups/storage/storage-factory.ts",
      "src/modules/backups/storage/storage-provider.ts",
      "src/modules/backups/backup-startup-health.ts",
      "src/lib/content/backup.ts",
    ];
    await Promise.all(removed.map(async (path) => {
      await expect(readFile(path, "utf8")).rejects.toThrow();
    }));
  });
  it("يربط مسارات إدارة المنصة بحفظ إعدادات GitHub", async () => {
    const platformActions = [
      "src/app/(admin)/admin/plans/actions.ts",
      "src/app/(admin)/admin/settings/actions.ts",
      "src/app/(admin)/admin/settings/payment/actions.ts",
      "src/app/(admin)/admin/templates/actions.ts",
      "src/app/(admin)/admin/templates/management-actions.ts",
      "src/app/(admin)/admin/templates/starter-defaults-actions.ts",
      "src/app/(admin)/admin/templates/template-image-actions.ts",
      "src/app/(admin)/admin/templates/template-visual-actions.ts",
      "src/app/(admin)/admin/feature-flags/actions.ts",
      "src/app/(admin)/admin/social-preview/actions.ts",
      "src/app/(admin)/admin/settings/social-preview/actions.ts",
    ];
    for (const path of platformActions) {
      expect(await readFile(path, "utf8")).toContain("syncPlatformConfigurationToGitHub");
    }
  });
  it("يعرض دليل GitHub مباشرة بعد النسخ اليدوي", async () => {
    const actions = await readFile("src/app/(admin)/admin/backups/actions.ts", "utf8");
    const page = await readFile("src/app/(admin)/admin/backups/page.tsx", "utf8");
    expect(actions).toContain("?job=");
    expect(page).toContain("اكتملت النسخة على Railway ووصلت إلى GitHub بعد Remote Verify");
    expect(page).toContain("فتح النسخة على GitHub");
  });
  it("يعيد فهرسة النسخة المستعادة داخل القاعدة الجديدة", async () => {
    const text = await readFile("src/modules/backups/frameid-restore-pipeline.ts", "utf8");
    expect(text).toContain("input.prisma.backupJob.upsert");
    expect(text).toContain("restoredManifest.backupJobId");
  });
});
