import { describe, expect, it } from "vitest";

import { selectDisasterRecoveryBackup, validateRestoredCounts } from "@/modules/backups/disaster-recovery-policy";

describe("سياسة العودة بعد فقد قاعدة البيانات", () => {
  it("تتجاوز نسخة تلقائية فارغة أُنشئت بعد الكارثة", () => {
    const selected = selectDisasterRecoveryBackup([
      { backupId: "2026-07-13_00-59", usersCount: 1, tenantsCount: 0, sitesCount: 0, mediaFilesCount: 0 },
      { backupId: "2026-07-13_00-55", usersCount: 4, tenantsCount: 3, sitesCount: 3, mediaFilesCount: 9 },
    ]);
    expect(selected?.backupId).toBe("2026-07-13_00-55");
  });

  it("يرفض إعلان نجاح الاستعادة إذا لم تعد العملاء والمواقع والملفات بنفس الأعداد", () => {
    expect(validateRestoredCounts(
      { usersCount: 4, tenantsCount: 3, sitesCount: 3, mediaFilesCount: 9 },
      { usersCount: 1, tenantsCount: 0, sitesCount: 0, mediaFilesCount: 0 },
    )).toEqual({ valid: false, errors: [
      "usersCount: المتوقع 4 والفعلي 1",
      "tenantsCount: المتوقع 3 والفعلي 0",
      "sitesCount: المتوقع 3 والفعلي 0",
      "mediaFilesCount: المتوقع 9 والفعلي 0",
    ] });
  });
});
