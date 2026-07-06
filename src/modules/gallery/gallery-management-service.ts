export type GalleryManagementRepository = {
  ensureAlbum(input: {
    siteId: string;
    slug: string;
    title: string;
  }): Promise<{ id: string }>;
  nextImageOrder(input: { albumId: string }): Promise<number>;
  addImage(input: {
    albumId: string;
    assetId: string;
    caption?: string;
    sortOrder: number;
  }): Promise<{ id: string }>;
};

export function createGalleryManagementService({
  repository
}: {
  repository: GalleryManagementRepository;
}) {
  return {
    async addPortfolioImage(input: {
      siteId: string;
      assetId: string;
      caption?: string;
    }): Promise<{ imageId: string; albumId: string }> {
      const assetId = input.assetId.trim();

      if (!assetId) {
        throw new Error("Gallery asset is required");
      }

      const album = await repository.ensureAlbum({
        siteId: input.siteId,
        slug: "portfolio",
        title: "Portfolio"
      });
      const sortOrder = await repository.nextImageOrder({ albumId: album.id });
      const image = await repository.addImage({
        albumId: album.id,
        assetId,
        caption: input.caption?.trim() || undefined,
        sortOrder
      });

      return {
        imageId: image.id,
        albumId: album.id
      };
    }
  };
}
