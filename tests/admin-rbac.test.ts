import { describe, expect, it } from "vitest";

import { canAccessSuperAdmin } from "@/modules/admin/admin-rbac";

describe("admin rbac", () => {
  it("allows operational admin roles into the super admin console", () => {
    expect(canAccessSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(canAccessSuperAdmin("OPERATIONS_ADMIN")).toBe(true);
    expect(canAccessSuperAdmin("BILLING_MANAGER")).toBe(true);
  });

  it("denies regular users", () => {
    expect(canAccessSuperAdmin("USER")).toBe(false);
  });
});
