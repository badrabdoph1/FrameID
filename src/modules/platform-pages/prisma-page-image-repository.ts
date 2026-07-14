import { prisma } from "@/lib/prisma";

type PlatformImageRecordInput = {
  id: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  focusX: number;
  focusY: number;
  zoom: number;
  originalName: string;
  actorId?: string | null;
};

type PlatformImageClient = {
  platformMediaAsset: {
    create(input: { data: Record<string, unknown> }): Promise<{ id: string; url: string }>;
  };
};

export function createPrismaPlatformPageImageRepository(
  client: PlatformImageClient = prisma as unknown as PlatformImageClient,
) {
  return {
    create(input: PlatformImageRecordInput) {
      return client.platformMediaAsset.create({
        data: {
          id: input.id,
          storageKey: input.storageKey,
          url: input.url,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          width: input.width,
          height: input.height,
          focusX: input.focusX,
          focusY: input.focusY,
          zoom: input.zoom,
          originalName: input.originalName,
          createdById: input.actorId ?? null,
        },
      });
    },
  };
}
