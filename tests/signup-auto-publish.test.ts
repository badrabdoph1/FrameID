import { describe, expect, it } from "vitest";

import { createPrismaSignupProvisioningRepository } from "@/modules/onboarding/prisma-signup-repository";
import type { AccountCreationInput } from "@/modules/onboarding/signup-provisioning";

const accountInput: AccountCreationInput = {
  user: {
    name: "Ali Ahmed",
    email: "ali@example.com",
    phone: null,
    passwordHash: "hashed-password"
  },
  tenant: {
    displayName: "Ali Ahmed",
    status: "TRIAL",
    trialStartedAt: new Date("2026-07-10T12:00:00.000Z"),
    trialEndsAt: new Date("2026-07-24T12:00:00.000Z")
  },
  site: {
    slug: "ali-ahmed",
    title: "Ali Ahmed",
    description: "Premium photography",
    themeCode: "noir-gold",
    templateCode: "noir-gold"
  },
  subscription: {
    status: "TRIAL",
    trialStartedAt: new Date("2026-07-10T12:00:00.000Z"),
    trialEndsAt: new Date("2026-07-24T12:00:00.000Z")
  },
  defaultContent: {
    sections: [],
    packages: [],
    extras: []
  }
};

describe("signup site publication", () => {
  it("creates the public site as published inside the signup transaction", async () => {
    let createdSiteData: Record<string, unknown> | null = null;

    const transaction = {
      theme: { async upsert() { return { id: "theme_1" }; } },
      template: { async upsert() { return { id: "template_1" }; } },
      user: { async create() { return { id: "user_1" }; } },
      tenant: { async create() { return { id: "tenant_1" }; } },
      site: {
        async create(args: { data: Record<string, unknown> }) {
          createdSiteData = args.data;
          return { id: "site_1", slug: String(args.data.slug) };
        }
      },
      siteThemeConfig: { async create() { return { id: "config_1" }; } },
      siteSection: { async createMany() { return { count: 0 }; } },
      package: { async createMany() { return { count: 0 }; } },
      extraService: { async createMany() { return { count: 0 }; } },
      subscription: {
        async create() {
          return { id: "subscription_1", status: "TRIAL" as const };
        }
      }
    };

    const prisma = {
      user: { async count() { return 0; } },
      site: { async findMany() { return []; } },
      async $transaction<T>(callback: (tx: typeof transaction) => Promise<T>) {
        return callback(transaction);
      }
    };

    const repository = createPrismaSignupProvisioningRepository(prisma);
    const result = await repository.createAccountWithSite(accountInput);

    expect(createdSiteData).toMatchObject({
      slug: "ali-ahmed",
      status: "PUBLISHED",
      isPublished: true
    });
    expect(result).toMatchObject({
      siteId: "site_1",
      slug: "ali-ahmed",
      subscriptionStatus: "TRIAL"
    });
  });
});
