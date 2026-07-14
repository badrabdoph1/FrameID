import { describe, expect, it } from "vitest";

import { isImmersiveAdminRoute } from "@/modules/admin/admin-route-mode";

describe("admin route mode", () => {
  it("reserves the full viewport only for page workspaces", () => {
    expect(isImmersiveAdminRoute("/admin/content/pages/home")).toBe(true);
    expect(isImmersiveAdminRoute("/admin/content/pages/templates")).toBe(true);
    expect(isImmersiveAdminRoute("/admin/content")).toBe(false);
    expect(isImmersiveAdminRoute("/admin/templates")).toBe(false);
  });
});
