import { createLocalMediaStorage } from "@/modules/media/local-media-storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_TEMPLATE_IMAGE_BYTES = 8 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "") || "template-image";
}

export async function uploadPlatformTemplateImage(
  file: File,
  options: {
    createId?: () => string;
    maxSizeBytes?: number;
  } = {},
): Promise<{ url: string; storageKey: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.");
  }

  const maxSizeBytes = options.maxSizeBytes ?? MAX_TEMPLATE_IMAGE_BYTES;
  if (file.size <= 0 || file.size > maxSizeBytes) {
    throw new Error("حجم الصورة غير صالح أو أكبر من 8 ميجابايت.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const createId = options.createId ?? (() => crypto.randomUUID());
  const storageKey = `platform/templates/${createId()}-${sanitizeFilename(file.name)}`;
  const stored = await createLocalMediaStorage().save({
    storageKey,
    bytes,
    mimeType: file.type,
  });

  return { url: stored.url, storageKey };
}
