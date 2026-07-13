import { describe, expect, it } from "vitest";

import { generateBackupId } from "@/modules/backups/backup-package-creator";

describe("معرّف حزمة النسخة", () => {
  it("لا يتصادم بين مهمتين داخل الدقيقة نفسها", () => {
    const createdAt = new Date("2026-07-13T02:12:49.123Z");
    const first = generateBackupId(createdAt, "job-a");
    const second = generateBackupId(createdAt, "job-b");

    expect(first).not.toBe(second);
    expect(first).toBe("2026-07-13_02-12-49-123_job-a");
    expect(second).toBe("2026-07-13_02-12-49-123_job-b");
  });
});
