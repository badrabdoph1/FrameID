import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("services platform UI visibility integration", () => {
  it("passes the central visibility decision into both application shells", () => {
    const dashboardLayout = source("src/app/(dashboard)/dashboard/layout.tsx");
    const adminLayout = source("src/app/(admin)/admin/layout.tsx");

    expect(dashboardLayout).toContain("isServicesPlatformUiVisible");
    expect(dashboardLayout).toContain("servicesPlatformVisible={servicesPlatformVisible}");
    expect(adminLayout).toContain("isServicesPlatformUiVisible");
    expect(adminLayout).toContain("servicesPlatformVisible={servicesPlatformVisible}");
  });

  it("exposes a dedicated switch in platform settings", () => {
    const settingsPage = source("src/app/(admin)/admin/settings/page.tsx");
    const settingsActions = source("src/app/(admin)/admin/settings/actions.ts");

    expect(settingsPage).toContain("updateServicesPlatformVisibilityAction");
    expect(settingsPage).toContain('name="servicesPlatformVisible"');
    expect(settingsActions).toContain("setServicesPlatformUiVisible");
  });

  it("guards direct customer and admin routes plus stale server actions", () => {
    const guardedLayouts = [
      "src/app/(dashboard)/dashboard/service-center/layout.tsx",
      "src/app/(admin)/admin/services/layout.tsx",
      "src/app/(admin)/admin/analytics/services/layout.tsx",
    ];

    for (const path of guardedLayouts) {
      expect(existsSync(resolve(root, path))).toBe(true);
      if (existsSync(resolve(root, path))) {
        expect(source(path)).toContain("isServicesPlatformUiVisible");
        expect(source(path)).toContain("notFound()");
      }
    }

    expect(source("src/app/(dashboard)/dashboard/service-center/actions.ts")).toContain("isServicesPlatformUiVisible");
    expect(source("src/app/(admin)/admin/services/actions.ts")).toContain("isServicesPlatformUiVisible");
  });
});
