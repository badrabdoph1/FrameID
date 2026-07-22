import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFile(resolve(process.cwd(), path), "utf8");

describe("customer services center contract", () => {
  it("exposes the four mobile-first customer views and canonical communication link", async () => {
    const page = await read("src/app/(dashboard)/dashboard/service-center/page.tsx");
    expect(page).toContain('key: "my"');
    expect(page).toContain('key: "discover"');
    expect(page).toContain('key: "requests"');
    expect(page).toContain('key: "billing"');
    expect(page).toContain('/dashboard/communication');
    expect(page).toContain("grid-cols-4");
  });

  it("derives tenant ownership from the authenticated session for every mutation", async () => {
    const actions = await read("src/app/(dashboard)/dashboard/service-center/actions.ts");
    expect(actions).toContain("session.tenant.id");
    expect(actions).not.toContain('formData, "tenantId"');
    expect(actions).toContain("requestServiceOfferingAction");
    expect(actions).toContain("cancelServiceSubscriptionAction");
  });
});
