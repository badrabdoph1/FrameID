import { describe, expect, it } from "vitest";

import { createPrismaGalleryManagementRepository } from "@/modules/gallery/prisma-gallery-management-repository";

describe("prisma gallery management repository", () => {
  it("upserts the default album and appends gallery images in order", async () => {
    const calls: string[] = [];
    const prisma = {
      galleryAlbum: {
        async findFirst(args: { where: { siteId: string; slug: string } }) {
          calls.push(`findAlbum:${args.where.siteId}:${args.where.slug}`);
          return null;
        },
        async create(args: { data: { siteId: string; slug: string; title: string } }) {
          calls.push(`createAlbum:${args.data.siteId}:${args.data.slug}:${args.data.title}`);
          return { id: "album_1" };
        }
      },
      galleryImage: {
        async aggregate(args: { where: { albumId: string } }) {
          calls.push(`aggregate:${args.where.albumId}`);
          return { _max: { sortOrder: 5 } };
        },
        async create(args: {
          data: { albumId: string; assetId: string; caption?: string; sortOrder: number };
        }) {
          calls.push(
            `createImage:${args.data.albumId}:${args.data.assetId}:${args.data.sortOrder}`
          );
          return { id: "image_1" };
        }
      }
    };
    const repository = createPrismaGalleryManagementRepository(prisma);

    await expect(
      repository.ensureAlbum({
        siteId: "site_1",
        slug: "portfolio",
        title: "Portfolio"
      })
    ).resolves.toEqual({ id: "album_1" });
    await expect(repository.nextImageOrder({ albumId: "album_1" })).resolves.toBe(6);
    await expect(
      repository.addImage({
        albumId: "album_1",
        assetId: "asset_1",
        sortOrder: 6
      })
    ).resolves.toEqual({ id: "image_1" });

    expect(calls).toEqual([
      "findAlbum:site_1:portfolio",
      "createAlbum:site_1:portfolio:Portfolio",
      "aggregate:album_1",
      "createImage:album_1:asset_1:6"
    ]);
  });
});
