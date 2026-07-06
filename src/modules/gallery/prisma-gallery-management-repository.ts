import type { GalleryManagementRepository } from "@/modules/gallery/gallery-management-service";

type PrismaGalleryManagementClient = {
  galleryAlbum: {
    findFirst(input: unknown): Promise<{ id: string } | null>;
    create(input: unknown): Promise<{ id: string }>;
  };
  galleryImage: {
    aggregate(input: unknown): Promise<unknown>;
    create(input: unknown): Promise<{ id: string }>;
  };
};

export function createPrismaGalleryManagementRepository(
  prisma: PrismaGalleryManagementClient
): GalleryManagementRepository {
  return {
    async ensureAlbum(input) {
      const existing = await prisma.galleryAlbum.findFirst({
        where: {
          siteId: input.siteId,
          slug: input.slug,
          deletedAt: null
        },
        select: {
          id: true
        }
      });

      if (existing) {
        return existing;
      }

      return prisma.galleryAlbum.create({
        data: {
          siteId: input.siteId,
          slug: input.slug,
          title: input.title,
          sortOrder: 0,
          isVisible: true
        },
        select: {
          id: true
        }
      });
    },
    async nextImageOrder(input) {
      const result = (await prisma.galleryImage.aggregate({
        where: {
          albumId: input.albumId,
          deletedAt: null
        },
        _max: {
          sortOrder: true
        }
      })) as { _max?: { sortOrder?: number | null } };

      return (result._max?.sortOrder ?? -1) + 1;
    },
    async addImage(input) {
      return prisma.galleryImage.create({
        data: {
          albumId: input.albumId,
          assetId: input.assetId,
          caption: input.caption,
          sortOrder: input.sortOrder
        },
        select: {
          id: true
        }
      });
    }
  };
}
