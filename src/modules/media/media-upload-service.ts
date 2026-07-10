import { UploadError } from "@/lib/errors/error-service";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_MAX_SIZE_BYTES = 16 * 1024 * 1024;

export type MediaStorageAdapter = {
  save(input: {
    storageKey: string;
    bytes: Uint8Array;
    mimeType: string;
  }): Promise<{ url: string }>;
};

export type MediaUploadRepository = {
  createAsset(input: {
    tenantId: string;
    storageKey: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    alt?: string;
  }): Promise<{ id: string; url: string }>;
};

export async function readValidatedImageFile(
  file: File,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
): Promise<Uint8Array> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new UploadError("FID-UPLOAD-002");
  }

  if (file.size <= 0 || file.size > maxSizeBytes) {
    throw new UploadError("FID-UPLOAD-001");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size || !matchesImageSignature(bytes, file.type)) {
    throw new UploadError(
      "FID-UPLOAD-002",
      "محتوى الملف لا يطابق صيغة الصورة. اختر صورة JPG أو PNG أو WebP حقيقية.",
    );
  }

  return bytes;
}

export function sanitizeUploadFilename(filename: string): string {
  return (
    filename
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "upload"
  );
}

export function matchesImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }

  if (mimeType === "image/webp") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }

  return false;
}

export function createMediaUploadService({
  storage,
  repository,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  createId = () => crypto.randomUUID()
}: {
  storage: MediaStorageAdapter;
  repository: MediaUploadRepository;
  maxSizeBytes?: number;
  createId?: () => string;
}) {
  return {
    async uploadImage(input: {
      tenantId: string;
      file: File;
      alt?: string;
    }): Promise<{ id: string; url: string }> {
      const bytes = await readValidatedImageFile(input.file, maxSizeBytes);
      const storageKey = `${input.tenantId}/${createId()}-${sanitizeUploadFilename(input.file.name)}`;
      const stored = await storage.save({
        storageKey,
        bytes,
        mimeType: input.file.type
      });

      return repository.createAsset({
        tenantId: input.tenantId,
        storageKey,
        url: stored.url,
        mimeType: input.file.type,
        sizeBytes: bytes.byteLength,
        alt: input.alt
      });
    }
  };
}
