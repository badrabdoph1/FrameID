import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import {
  readValidatedImageFile,
  sanitizeUploadFilename,
  type MediaStorageAdapter,
} from "@/modules/media/media-upload-service";

const MAX_TEMPLATE_IMAGE_BYTES = 8 * 1024 * 1024;

export async function uploadPlatformTemplateImage(
  file: File,
  options: {
    createId?: () => string;
    maxSizeBytes?: number;
    storage?: MediaStorageAdapter;
  } = {},
): Promise<{ url: string; storageKey: string }> {
  const bytes = await readValidatedImageFile(
    file,
    options.maxSizeBytes ?? MAX_TEMPLATE_IMAGE_BYTES,
  );
  const createId = options.createId ?? (() => crypto.randomUUID());
  const storageKey = `platform/templates/${createId()}-${sanitizeUploadFilename(file.name)}`;
  const stored = await (options.storage ?? createLocalMediaStorage()).save({
    storageKey,
    bytes,
    mimeType: file.type,
  });

  return { url: stored.url, storageKey };
}
