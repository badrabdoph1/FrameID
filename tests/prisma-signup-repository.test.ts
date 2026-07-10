import { describe, expect, it } from "vitest";

import { createPrismaSignupProvisioningRepository } from "@/modules/onboarding/prisma-signup-repository";
import type { AccountCreationInput } from "@/modules/onboarding/signup-provisioning";

function createAccountInput(): AccountCreationInput {
  return {
    user: {
      name: "Ali Ahmed",
      email: "ali@example.com",
      phone: null,
      passwordHash: "hashed-password"
    },
    tenant: {
      displayName: "Ali Ahmed",
      status: "TRIAL",
      trialStartedAt: new Date("2026-07-06T12:00:00.000Z"),
      trialEndsAt: new Date("2026-07-20T12:00:00.000Z")
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
      trialStartedAt: new Date("2026-07-06T12:00:00.000Z"),
      trialEndsAt: new Date("2026-07-20T12:00:00.000Z")
    },
    defaultContent: {
      sections: [
        {
          type: "hero",
          title: "Home",
          sortOrder: 0,
          data: { headline: "Ali Ahmed" }
        }
      ],
      packages: [
        {
          name: "Silver",
          subtitle: "Engagement",
          priceAmount: 2500,
          currency: "EGP",
          features: ["Album"],
          isHighlighted: false,
          sortOrder: 0
        }
      ],
      extras: [
        {
          name: "Reel",
          priceAmount: 1000,
          currency: "EGP",
          iconKey: "film",
          sortOrder: 0
        }
      ]
    }
  };
}

describe("prisma signup repository", () => {
  it("creates the account, tenant, site, content and trial subscription in one transaction", async () => {
    const operations: string[] = [];
    const tx = {
      theme: {
        async upsert() {
          operations.push("theme");
          return { id: "theme_1" };
        }
      },
      template: {
        async upsert() {
          operations.push("template");
          return { id: "template_1" };
        }
      },
      user: {
        async create() {
          operations.push("user");
          return { id: "user_1" };
        }
      },
      tenant: {
        async create() {
          operations.push("tenant");
          return { id: "tenant_1" };
        }
      },
      site: {
        async create(args: { data: { slug: string } }) {
          operations.push(`site:${args.data.slug}`);
          return { id: "site_1", slug: args.data.slug };
        }
      },
      siteThemeConfig: {
        async create(args: { data: { siteId: string; themeId: string; config: unknown } }) {
          operations.push(`config:${args.data.siteId}:${args.data.themeId}`);
          return { id: "config_1" };
        }
      },
      siteSection: {
        async createMany() {
          operations.push("sections");
          return { count: 1 };
        }
      },
      package: {
        async createMany(args: { data: unknown[] }) {
          operations.push(`packages:${args.data.length}`);
          return { count: args.data.length };
        }
      },
      extraService: {
        async createMany(args: { data: unknown[] }) {
          operations.push(`extras:${args.data.length}`);
          return { count: args.data.length };
        }
      },
      subscription: {
        async create(args: { data: { status: "TRIAL" } }) {
          operations.push(`subscription:${args.data.status}`);
          return { id: "subscription_1", status: args.data.status };
        }
      }
    };
    const prisma = {
      user: {
        async count() {
          return 0;
        }
      },
      site: {
        async findMany() {
          return [{ slug: "used-slug" }];
        }
      },
      async $transaction<T>(callback: (transaction: typeof tx) => Promise<T>) {
        operations.push("begin");
        const result = await callback(tx);
        operations.push("commit");
        return result;
      }
    };

    const repository = createPrismaSignupProvisioningRepository(prisma);

    await expect(
      repository.identifierExists({ email: "ali@example.com", phone: null })
    ).resolves.toBe(false);
    await expect(repository.getUnavailableSlugs()).resolves.toEqual(
      new Set(["used-slug"])
    );

    const result = await repository.createAccountWithSite(createAccountInput());

    expect(result).toEqual({
      userId: "user_1",
      tenantId: "tenant_1",
      siteId: "site_1",
      slug: "ali-ahmed",
      subscriptionStatus: "TRIAL"
    });
    expect(operations).toEqual([
      "begin",
      "theme",
      "template",
      "user",
      "tenant",
      "site:ali-ahmed",
      "config:site_1:theme_1",
      "sections",
      "packages:1",
      "extras:1",
      "subscription:TRIAL",
      "commit"
    ]);
  });
});
