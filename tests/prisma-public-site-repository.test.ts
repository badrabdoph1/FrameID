import { describe, expect, it } from "vitest";

import { createPrismaPublicSiteRepository } from "@/modules/public-sites/prisma-public-site-repository";

describe("prisma public site repository", () => {
  it("loads published sites without querying a non-existent package image relation", async () => {
    const prisma = {
      site: {
        async findFirst(args: {
          where: {
            slug: string;
            deletedAt: null;
            isPublished: true;
          };
          select: {
            packages: {
              select: Record<string, unknown>;
            };
          };
        }) {
          expect(args.where).toEqual({
            slug: "ali-ahmed",
            deletedAt: null,
            isPublished: true
          });
          expect(args.select.packages.select).not.toHaveProperty("imageAsset");

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
            packages: [
              {
                id: "package_1",
                name: "Wedding",
                subtitle: null,
                priceAmount: 5000,
                currency: "EGP",
                features: [],
                isHighlighted: false
              }
            ],
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
      },
      packages: [
        {
          id: "package_1",
          imageUrl: null
        }
      ]
    });
  });
});
