import { describe, expect, it } from "vitest";

import { getPlatformSeedData } from "@/modules/setup/platform-seed-data";

describe("platform seed data", () => {
  it("contains the required production baseline records", () => {
    const seedData = getPlatformSeedData();

    expect(seedData.themes).toHaveLength(2);
    expect(seedData.themes.map((theme) => theme.code)).toEqual([
      "noir-gold",
      "rose-blush"
    ]);
    expect(seedData.themes.find((theme) => theme.code === "noir-gold")).toMatchObject({
      code: "noir-gold",
      status: "PUBLISHED"
    });
    expect(
      seedData.templates.find((template) => template.code === "noir-gold")
    ).toMatchObject({
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
