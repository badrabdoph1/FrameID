import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";
import { prisma } from "@/lib/prisma";

const MAX_PLATFORM_IMAGE_BYTES = 8 * 1024 * 1024;

type UploadOptions = {
  createId?: () => string;
  maxSizeBytes?: number;
};

const uploadService = createMediaUploadService({
  storage: createLocalMediaStorage(),
  repository: createPrismaMediaUploadRepository(prisma),
  maxSizeBytes: MAX_PLATFORM_IMAGE_BYTES,
});

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
  const asset = await uploadService.uploadImage({
    tenantId: "platform",
    file,
    alt: directory === "platform/social-preview" ? "معاينة منصة التواصل" : "قالب منصة",
  });

  return { url: asset.url, storageKey: asset.id };
}