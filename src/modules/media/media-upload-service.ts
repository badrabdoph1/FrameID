import { UploadError } from "@/lib/errors/error-service";
import {
  processImageFromFile,
  generateStorageKey,
  sanitizeFilename,
  matchesImageSignature,
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  ImageProcessingError,
} from "@/modules/media/image-processing-service";

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
    width: number;
    height: number;
    alt?: string;
  }): Promise<{ id: string; url: string }>;
};

export { sanitizeFilename, generateStorageKey, matchesImageSignature, ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, ImageProcessingError };

export function createMediaUploadService({
  storage,
  repository,
  maxSizeBytes = MAX_UPLOAD_BYTES,
  createId = () => crypto.randomUUID(),
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
    }): Promise<{ id: string; url: string; width: number; height: number; sizeBytes: number }> {
      try {
        const processed = await processImageFromFile(input.file, {
          maxSizeBytes,
        });

        const storageKey = generateStorageKey(input.tenantId, input.file.name, createId);

        const stored = await storage.save({
          storageKey,
          bytes: new Uint8Array(processed.buffer),
          mimeType: processed.mimeType,
        });

        return repository.createAsset({
          tenantId: input.tenantId,
          storageKey,
          url: stored.url,
          mimeType: processed.mimeType,
          sizeBytes: processed.sizeBytes,
          width: processed.width,
          height: processed.height,
          alt: input.alt,
        });
      } catch (error) {
        if (error instanceof ImageProcessingError) {
          throw new UploadError(error.code, error.userMessage);
        }
        if (error instanceof UploadError) {
          throw error;
        }
        console.error("[media-upload] unexpected error:", error);
        throw new UploadError(
          "FID-UPLOAD-999",
          "حدث خطأ غير متوقع أثناء رفع الصورة. جرب مرة أخرى."
        );
      }
    },
  };
}