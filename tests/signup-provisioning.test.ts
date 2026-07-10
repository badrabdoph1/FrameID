import { describe, expect, it } from "vitest";

import {
  createSignupProvisioningService,
  resolveAvailableSlug,
  type SignupProvisioningRepository
} from "@/modules/onboarding/signup-provisioning";

function createRepository(
  existingSlugs: string[] = []
): SignupProvisioningRepository & {
  calls: string[];
} {
  const calls: string[] = [];

  return {
    calls,
    async identifierExists({ email, phone }) {
      calls.push(`identifier:${email}:${phone ?? "none"}`);
      return email === "used@example.com";
    },
    async getUnavailableSlugs() {
      calls.push("slugs");
      return new Set(existingSlugs);
    },
    async createAccountWithSite(input) {
      calls.push("transaction");
      calls.push(`packages:${input.defaultContent.packages.length}`);
      calls.push(`extras:${input.defaultContent.extras.length}`);
      return {
        userId: "user_1",
        tenantId: "tenant_1",
        siteId: "site_1",
        slug: input.site.slug,
        subscriptionStatus: input.subscription.status
      };
    }
  };
}

describe("signup provisioning", () => {
  it("creates a user, tenant, site, default content and trial subscription", async () => {
    const repository = createRepository(["ali-ahmed-studio"]);
    const service = createSignupProvisioningService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    const result = await service.provisionTrialSite({
      name: "Ali Ahmed Studio",
      identifier: "ali@example.com",
      password: "StrongPass123!",
      selectedTemplateCode: "noir-gold"
    });

    expect(repository.calls).toEqual([
      "identifier:ali@example.com:none",
      "slugs",
      "transaction",
      "packages:3",
      "extras:5"
    ]);
    expect(result).toMatchObject({
      userId: "user_1",
      tenantId: "tenant_1",
      siteId: "site_1",
      slug: "ali-ahmed-photo",
      subscriptionStatus: "TRIAL",
      redirectTo: "/dashboard"
    });
  });

  it("stops before provisioning when the identifier is already used", async () => {
    const repository = createRepository();
    const service = createSignupProvisioningService({ repository });

    await expect(
      service.provisionTrialSite({
        name: "Ali Ahmed",
        identifier: "used@example.com",
        password: "StrongPass123!"
      })
    ).rejects.toThrow("رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل");

    expect(repository.calls).toEqual(["identifier:used@example.com:none"]);
  });

  it("skips reserved route names when generating a site slug", () => {
    expect(resolveAvailableSlug("Admin", new Set())).toBe("admin-studio");
  });

  it("uses a safe fallback when the display name cannot become a URL slug", () => {
    expect(resolveAvailableSlug("مصور القاهرة", new Set())).toBe(
      "photographer-studio"
    );
  });
});
