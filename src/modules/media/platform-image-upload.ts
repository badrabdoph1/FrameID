import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import {
  readValidatedImageFile,
  sanitizeUploadFilename,
  type MediaStorageAdapter,
} from "@/modules/media/media-upload-service";

const MAX_PLATFORM_IMAGE_BYTES = 8 * 1024 * 1024;

type UploadOptions = {
  createId?: () => string;
  maxSizeBytes?: number;
  storage?: MediaStorageAdapter;
};

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
  const bytes = await readValidatedImageFile(
    file,
    options.maxSizeBytes ?? MAX_PLATFORM_IMAGE_BYTES,
  );
  const createId = options.createId ?? (() => crypto.randomUUID());
  const storageKey = `${directory}/${createId()}-${sanitizeUploadFilename(file.name)}`;
  const stored = await (options.storage ?? createLocalMediaStorage()).save({
    storageKey,
    bytes,
    mimeType: file.type,
  });

  return { url: stored.url, storageKey };
}
