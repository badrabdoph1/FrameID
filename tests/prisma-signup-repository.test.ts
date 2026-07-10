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
      themeConfig: { colorPreset: "test" },
      contact: {
        studioName: "Ali Ahmed",
        bio: "Photographer",
        longDescription: "Premium photography studio",
        callToAction: "Book now",
        phone: null,
        whatsapp: null,
        email: "ali@example.com",
        instagram: null,
        facebook: null
      },
      seo: {
        title: "Ali Ahmed",
        description: "Premium photography",
        robotsIndex: true,
        structuredDataOverrides: {}
      },
      sections: [
        {
          type: "hero",
          title: "Home",
          sortOrder: 0,
          isVisible: true,
          data: { headline: "Ali Ahmed" }
        }
      ],
      packages: [
        {
          id: "silver",
          name: "Silver",
          subtitle: "Engagement",
          price: "2,500 EGP",
          priceAmount: 2500,
          currency: "EGP",
          features: ["Album"],
          imageUrl: "https://example.com/package.jpg",
          isHighlighted: false,
          sortOrder: 0
        }
      ],
      extras: [
        {
          id: "reel",
          name: "Reel",
          description: "Short social reel",
          price: "1,000 EGP",
          priceAmount: 1000,
          currency: "EGP",
          iconKey: "film",
          sortOrder: 0
        }
      ],
      gallery: [
        {
          id: "gallery-1",
          url: "https://example.com/gallery.jpg",
          alt: "Gallery image",
          caption: "Gallery caption",
          sortOrder: 0,
          isFeatured: true
        }
      ]
    }
  };
}

describe("prisma signup repository", () => {
  it("creates the account, tenant, site, content and trial subscription in one transaction", async () => {
    const operations: string[] = [];
    let assetCounter = 0;
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
      contactProfile: {
        async create() {
          operations.push("contact");
          return { id: "contact_1" };
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
      galleryAlbum: {
        async create() {
          operations.push("gallery-album");
          return { id: "album_1" };
        }
      },
      mediaAsset: {
        async create() {
          assetCounter += 1;
          operations.push(`media:${assetCounter}`);
          return { id: `asset_${assetCounter}` };
        }
      },
      galleryImage: {
        async create() {
          operations.push("gallery-image");
          return { id: "gallery_image_1" };
        }
      },
      sEOSettings: {
        async create() {
          operations.push("seo");
          return { id: "seo_1" };
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
      template: {
        async findUnique() {
          return { status: "PUBLISHED", deletedAt: null, previewData: null };
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
      "contact",
      "packages:1",
      "extras:1",
      "gallery-album",
      "media:1",
      "gallery-image",
      "seo",
      "subscription:TRIAL",
      "commit"
    ]);
  });
});
