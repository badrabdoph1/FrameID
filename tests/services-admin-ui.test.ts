import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("services administration contract", () => {
  it("registers all operational workspaces in admin navigation", async () => {
    const navigation = await read("src/modules/admin/navigation.ts");
    for (const route of ["/admin/services", "/admin/services/acquisitions", "/admin/services/fulfillment", "/admin/services/entitlements", "/admin/services/subscriptions", "/admin/services/recommendations", "/admin/analytics/services"]) {
      expect(navigation).toContain(route);
    }
  });

  it("guards services commands and records sensitive changes", async () => {
    const actions = await read("src/app/(admin)/admin/services/actions.ts");
    expect(actions).toContain('requireAdminPermission("services", "edit")');
    expect(actions).toContain("audit(admin.id");
    expect(actions).toContain("publishServicesProductAction");
    expect(actions).toContain("refundServicePaymentAction");
  });
});
