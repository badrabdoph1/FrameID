import { describe, expect, it } from "vitest";

import {
  createSignupProvisioningService,
  resolveAvailableSlug,
  type AccountCreationInput,
  type SignupProvisioningRepository
} from "@/modules/onboarding/signup-provisioning";

function createRepository(
  existingSlugs: string[] = []
): SignupProvisioningRepository & {
  calls: string[];
  createdInput: AccountCreationInput | null;
} {
  const repository: SignupProvisioningRepository & {
    calls: string[];
    createdInput: AccountCreationInput | null;
  } = {
    calls: [],
    createdInput: null,
    async isTemplateAvailable(templateCode) {
      repository.calls.push(`template:${templateCode}`);
      return templateCode === "noir-gold" || templateCode === "rose-blush";
    },
    async identifierExists({ email, phone }) {
      repository.calls.push(`identifier:${email}:${phone ?? "none"}`);
      return email === "used@example.com";
    },
    async getUnavailableSlugs() {
      repository.calls.push("slugs");
      return new Set(existingSlugs);
    },
    async createAccountWithSite(input) {
      repository.createdInput = input;
      repository.calls.push("transaction");
      repository.calls.push(`packages:${input.defaultContent.packages.length}`);
      repository.calls.push(`extras:${input.defaultContent.extras.length}`);
      return {
        userId: "user_1",
        tenantId: "tenant_1",
        siteId: "site_1",
        slug: input.site.slug,
        subscriptionStatus: input.subscription.status
      };
    }
  };

  return repository;
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
      "template:noir-gold",
      "identifier:ali@example.com:none",
      "slugs",
      "transaction",
      "packages:3",
      "extras:3"
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

  it("uses signup email while keeping template phone and WhatsApp", async () => {
    const repository = createRepository();
    const service = createSignupProvisioningService({ repository });

    await service.provisionTrialSite({
      name: "Ali Ahmed",
      identifier: "ali@example.com",
      password: "StrongPass123!",
      selectedTemplateCode: "noir-gold"
    });

    expect(repository.createdInput?.defaultContent.contact.email).toBe("ali@example.com");
    expect(repository.createdInput?.defaultContent.contact.phone).toBe("+201000000001");
    expect(repository.createdInput?.defaultContent.contact.whatsapp).toBe("+201000000001");
    expect(repository.createdInput?.defaultContent.contact.studioName).toBe("Photography");
  });

  it("uses signup phone for phone and WhatsApp while keeping template email", async () => {
    const repository = createRepository();
    const service = createSignupProvisioningService({ repository });

    await service.provisionTrialSite({
      name: "Ali Ahmed",
      identifier: "+201012345678",
      password: "StrongPass123!",
      selectedTemplateCode: "noir-gold"
    });

    expect(repository.createdInput?.defaultContent.contact.phone).toBe("+201012345678");
    expect(repository.createdInput?.defaultContent.contact.whatsapp).toBe("+201012345678");
    expect(repository.createdInput?.defaultContent.contact.email).toBe("hello@kareemmagdy.example");
    expect(repository.createdInput?.defaultContent.contact.studioName).toBe("Photography");
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

    expect(repository.calls).toEqual([
      "template:noir-gold",
      "identifier:used@example.com:none"
    ]);
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
