import { describe, expect, it } from "vitest";

import {
  createSignupProvisioningService,
  type AccountCreationInput,
  type SignupProvisioningRepository
} from "@/modules/onboarding/signup-provisioning";

describe("signup trial duration", () => {
  it("uses the trial day count supplied from the admin lifecycle settings", async () => {
    const registrationDate = new Date("2026-07-10T12:00:00.000Z");
    const capturedInputs: AccountCreationInput[] = [];

    const repository: SignupProvisioningRepository = {
      async identifierExists() {
        return false;
      },
      async identifierExistsInTrash() {
        return false;
      },
      async getUnavailableSlugs() {
        return new Set<string>();
      },
      async isTemplateAvailable(templateCode) {
        return templateCode === "noir-gold" || templateCode === "rose-blush";
      },
      async createAccountWithSite(input) {
        capturedInputs.push(input);
        return {
          userId: "user_1",
          tenantId: "tenant_1",
          siteId: "site_1",
          slug: input.site.slug,
          subscriptionStatus: "TRIAL"
        };
      }
    };

    const service = createSignupProvisioningService({
      repository,
      now: () => registrationDate,
      trialDays: 21
    });

    await service.provisionTrialSite({
      name: "Ali Ahmed",
      identifier: "ali@example.com",
      password: "StrongPass123!"
    });

    const accountInput = capturedInputs[0];
    expect(accountInput).toBeDefined();
    expect(accountInput.tenant.trialStartedAt).toEqual(registrationDate);
    expect(accountInput.tenant.trialEndsAt).toEqual(new Date("2026-07-31T12:00:00.000Z"));
    expect(accountInput.subscription.trialStartedAt).toEqual(registrationDate);
    expect(accountInput.subscription.trialEndsAt).toEqual(new Date("2026-07-31T12:00:00.000Z"));
  });
});
