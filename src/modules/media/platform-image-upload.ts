import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";
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
  return uploadPlatformImage(file, "platform/templates", options);
}

export async function uploadPlatformSocialPreviewImage(
  file: File,
  options: UploadOptions = {},
): Promise<{ url: string; storageKey: string }> {
  return uploadPlatformImage(file, "platform/social-preview", options);
}

async function uploadPlatformImage(
  file: File,
  directory: string,
  options: UploadOptions,
): Promise<{ url: string; storageKey: string }> {
  const service = createUploadService(options);
  const asset = await service.uploadImage({
    tenantId: "platform",
    file,
    alt: directory === "platform/social-preview" ? "معاينة منصة التواصل" : "قالب منصة",
  });

  return { url: asset.url, storageKey: asset.id };
}