import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { BACKUP_POLICY, SUPPORTED_BACKUP_TYPES } from "@/modules/backups/backup-policy";
describe("عقد Backup Architecture", () => {
  it("يثبت السياسة", () => { expect(SUPPORTED_BACKUP_TYPES).toEqual(["DATABASE", "FULL"]); expect(BACKUP_POLICY).toEqual({ DATABASE: { schedule: "0 */12 * * *", retentionCount: 20 }, FULL: { schedule: "0 3 */2 * *", retentionCount: 10 } }); });
  it("يثبت نفس السياسة داخل seed الإنتاج", async () => {
    const text = await readFile("prisma/seed.ts", "utf8");
    expect(text).toContain('schedule: "0 */12 * * *", retentionCount: 20');
    expect(text).toContain('schedule: "0 3 */2 * *", retentionCount: 10');
    expect(text).not.toContain('schedule: "0 3 */3 * *"');
  });
  it("يجعل Actions مشغلاً فقط", async () => { const text = await readFile(".github/workflows/backup.yml", "utf8"); expect(text).not.toMatch(/pg_dump|pg_restore|git\s+push|checksum|retention|npm run backup/i); expect(text).toContain("/api/backups/run"); });
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
});
