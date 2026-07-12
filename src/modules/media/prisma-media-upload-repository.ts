import type { MediaUploadRepository } from "@/modules/media/media-upload-service";

type PrismaMediaUploadClient = {
  mediaAsset: {
    create(input: unknown): Promise<{ id: string; url: string }>;
  };
};

export function createPrismaMediaUploadRepository(
  prisma: PrismaMediaUploadClient
): MediaUploadRepository {
  return {
    async createAsset(input) {
      return prisma.mediaAsset.create({
        data: {
          tenantId: input.tenantId,
          storageKey: input.storageKey,
          url: input.url,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          width: input.width,
          height: input.height,
          alt: input.alt,
        },
        select: {
          id: true,
          url: true,
        },
      });
    },
  };
}