import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";
import { processImageFromFile, processImageFromBuffer } from "@/modules/media/image-processing-service";
import { prisma } from "@/lib/prisma";

const MAX_PLATFORM_IMAGE_BYTES = 8 * 1024 * 1024;

type UploadOptions = {
  createId?: () => string;
  maxSizeBytes?: number;
  storage?: ReturnType<typeof createLocalMediaStorage>;
  repository?: ReturnType<typeof createPrismaMediaUploadRepository>;
};

function createUploadService(options: UploadOptions = {}) {
  return createMediaUploadService({
    storage: options.storage ?? createLocalMediaStorage(),
    repository: options.repository ?? createPrismaMediaUploadRepository(prisma),
    maxSizeBytes: options.maxSizeBytes ?? MAX_PLATFORM_IMAGE_BYTES,
    createId: options.createId,
  });
}

export async function uploadPlatformTemplateImage(
  file: File,
  options: UploadOptions = {},
): Promise<{ url: string; storageKey: string }> {
  return uploadPlatformImage(file, "templates", options);
}

export async function uploadPlatformSocialPreviewImage(
  file: File,
  options: UploadOptions = {},
): Promise<{ url: string; storageKey: string }> {
  return uploadPlatformImage(file, "social-preview", options);
}

async function uploadPlatformImage(
  file: File,
  directory: string,
  options: UploadOptions,
): Promise<{ url: string; storageKey: string }> {
  const service = createUploadService(options);

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const processed = await processImageFromBuffer(inputBuffer, file.type, {
    maxSizeBytes: options.maxSizeBytes ?? MAX_PLATFORM_IMAGE_BYTES,
  });

  const storage = options.storage ?? createLocalMediaStorage();
  const createId = options.createId ?? (() => crypto.randomUUID());
  const { generateStorageKey } = await import("@/modules/media/image-processing-service");
  const storageKey = generateStorageKey("platform", file.name, createId, directory);

  const stored = await storage.save({
    storageKey,
    bytes: new Uint8Array(processed.buffer),
    mimeType: processed.mimeType,
  });

  const repository = options.repository ?? createPrismaMediaUploadRepository(prisma);
  const asset = await repository.createAsset({
    tenantId: "platform",
    storageKey,
    url: stored.url,
    mimeType: processed.mimeType,
    sizeBytes: processed.sizeBytes,
    width: processed.width,
    height: processed.height,
    alt: directory === "platform/social-preview" ? "معاينة منصة التواصل" : "قالب منصة",
  });

  return { url: asset.url, storageKey: asset.id };
}