import { describe, expect, it } from "vitest";

import {
  createGalleryManagementService,
  type GalleryManagementRepository
} from "@/modules/gallery/gallery-management-service";

function createRepository(): GalleryManagementRepository & { writes: string[] } {
  const writes: string[] = [];

  return {
    writes,
    async ensureAlbum(input) {
      writes.push(`album:${input.siteId}:${input.slug}`);
      return { id: "album_1" };
    },
    async nextImageOrder(input) {
      writes.push(`order:${input.albumId}`);
      return 3;
    },
    async addImage(input) {
      writes.push(`image:${input.albumId}:${input.assetId}:${input.sortOrder}`);
      return { id: "image_1" };
    }
  };
}

describe("gallery management service", () => {
  it("adds an uploaded image to the default portfolio album", async () => {
    const repository = createRepository();
    const service = createGalleryManagementService({ repository });

    await expect(
      service.addPortfolioImage({
        siteId: "site_1",
        assetId: "asset_1",
        caption: "Wedding detail"
      })
    ).resolves.toEqual({ imageId: "image_1", albumId: "album_1" });

    expect(repository.writes).toEqual([
      "album:site_1:portfolio",
      "order:album_1",
      "image:album_1:asset_1:3"
    ]);
  });

  it("rejects missing asset ids", async () => {
    const repository = createRepository();
    const service = createGalleryManagementService({ repository });

    await expect(
      service.addPortfolioImage({
        siteId: "site_1",
        assetId: " "
      })
    ).rejects.toThrow("Gallery asset is required");

    expect(repository.writes).toEqual([]);
  });
});
