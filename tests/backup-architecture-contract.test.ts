import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { BACKUP_POLICY, SUPPORTED_BACKUP_TYPES } from "@/modules/backups/backup-policy";
describe("عقد Backup Architecture", () => {
  it("يثبت السياسة", () => { expect(SUPPORTED_BACKUP_TYPES).toEqual(["DATABASE", "FULL"]); expect(BACKUP_POLICY).toEqual({ DATABASE: { schedule: "0 */12 * * *", retentionCount: 20 }, FULL: { schedule: "0 3 */2 * *", retentionCount: 10 } }); });
  it("يجعل Actions مشغلاً فقط", async () => { const text = await readFile(".github/workflows/backup.yml", "utf8"); expect(text).not.toMatch(/pg_dump|pg_restore|git\s+push|checksum|retention|npm run backup/i); expect(text).toContain("/api/backups/run"); });
});
