import { describe, expect, it } from "vitest";

import { createPrismaPublicSiteRepository } from "@/modules/public-sites/prisma-public-site-repository";

describe("prisma public site repository", () => {
  it("loads only published non-deleted public sites by slug", async () => {
    const prisma = {
      site: {
        async findFirst(args: {
          where: {
            slug: string;
            deletedAt: null;
            isPublished: true;
          };
        }) {
          expect(args.where).toEqual({
            slug: "ali-ahmed",
            deletedAt: null,
            isPublished: true
          });

          return {
            id: "site_1",
            slug: "ali-ahmed",
            title: "Ali Ahmed",
            description: "Photography",
            status: "PUBLISHED",
            isPublished: true,
            theme: { code: "noir-gold", name: "Noir Gold" },
            tenant: { displayName: "Ali Ahmed" },
            contact: null,
            sections: [],
            packages: [],
            extras: [],
            albums: [],
            seoSettings: null
          };
        }
      }
    };
    const repository = createPrismaPublicSiteRepository(prisma);

    await expect(repository.findBySlug("ali-ahmed")).resolves.toMatchObject({
      id: "site_1",
      slug: "ali-ahmed",
      theme: {
        code: "noir-gold"
      }
    });
  });
});
