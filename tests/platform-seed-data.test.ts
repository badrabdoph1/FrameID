import { describe, expect, it } from "vitest";

import { getPlatformSeedData } from "@/modules/setup/platform-seed-data";

describe("platform seed data", () => {
  it("contains the required production baseline records", () => {
    const seedData = getPlatformSeedData();

    expect(seedData.themes).toHaveLength(1);
    expect(seedData.themes[0]).toMatchObject({
      code: "noir-gold",
      status: "PUBLISHED"
    });
    expect(seedData.templates[0]).toMatchObject({
      code: "noir-gold",
      themeCode: "noir-gold",
      status: "PUBLISHED"
    });
    expect(seedData.plans[0]).toMatchObject({
      code: "starter",
      currency: "EGP",
      isActive: true
    });
    expect(seedData.backupSettings.map((setting) => setting.type)).toEqual([
      "DATABASE",
      "UPLOADS",
      "FULL"
    ]);
  });
});
