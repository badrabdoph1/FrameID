import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import {
  readValidatedImageFile,
  sanitizeUploadFilename,
  type MediaStorageAdapter,
} from "@/modules/media/media-upload-service";

const MAX_TEMPLATE_IMAGE_BYTES = 8 * 1024 * 1024;

function translateUploadError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === "Unsupported media type") {
      throw new Error("صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.");
    }
    if (error.message === "Media file is too large") {
      throw new Error("حجم الصورة غير صالح أو أكبر من 8 ميجابايت.");
    }
    if (error.message === "File content does not match its image type") {
      throw new Error("محتوى الملف لا يطابق صيغة الصورة المختارة.");
    }
  }
  throw error;
}

export async function uploadPlatformTemplateImage(
  file: File,
  options: {
    createId?: () => string;
    maxSizeBytes?: number;
    storage?: MediaStorageAdapter;
  } = {},
): Promise<{ url: string; storageKey: string }> {
  let bytes: Uint8Array;
  try {
    bytes = await readValidatedImageFile(
      file,
      options.maxSizeBytes ?? MAX_TEMPLATE_IMAGE_BYTES,
    );
  } catch (error) {
    translateUploadError(error);
  }

  const createId = options.createId ?? (() => crypto.randomUUID());
  const storageKey = `platform/templates/${createId()}-${sanitizeUploadFilename(file.name)}`;
  const stored = await (options.storage ?? createLocalMediaStorage()).save({
    storageKey,
    bytes,
    mimeType: file.type,
  });

  return { url: stored.url, storageKey };
}
