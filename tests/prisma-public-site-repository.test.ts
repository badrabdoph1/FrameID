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
            contactProfile: { select: Record<string, unknown> };
            sections: { where: Record<string, unknown> };
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
          expect(args.select.packages.select).toHaveProperty("imageUrl", true);
          expect(args.select.contactProfile.select).toMatchObject({ tiktok: true, workLocation: true });
          expect(args.select.sections.where).toEqual({ deletedAt: null });

          return {
            id: "site_1",
            slug: "ali-ahmed",
            title: "Ali Ahmed",
            description: "Photography",
            status: "PUBLISHED",
            isPublished: true,
            theme: { code: "noir-gold", name: "Noir Gold" },
            tenant: { displayName: "Ali Ahmed" },
            contactProfile: null,
            sections: [],
            packages: [
              {
                id: "package_1",
                name: "Wedding",
                subtitle: null,
                priceAmount: 5000,
                currency: "EGP",
                features: [],
                isHighlighted: false,
                imageUrl: null,
              }
            ],
            extraServices: [],
            galleryAlbums: [],
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
