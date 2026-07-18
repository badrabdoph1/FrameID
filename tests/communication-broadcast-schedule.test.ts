import { describe, expect, it } from "vitest";

import { parseLocalBroadcastSchedule } from "@/modules/communication-center/broadcast-schedule";

describe("broadcast schedule", () => {
  it("converts the browser local time using its timezone offset", () => {
    expect(parseLocalBroadcastSchedule("2026-07-18T12:00", "-180")?.toISOString()).toBe("2026-07-18T09:00:00.000Z");
  });

  it("rejects scheduling without a trustworthy browser offset", () => {
    expect(() => parseLocalBroadcastSchedule("2026-07-18T12:00", "")).toThrow("المنطقة الزمنية");
  });
});
