const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_MAX_SIZE_BYTES = 8 * 1024 * 1024;

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
      if (!ALLOWED_IMAGE_TYPES.has(input.file.type)) {
        throw new Error("Unsupported media type");
      }

      if (input.file.size > maxSizeBytes) {
        throw new Error("Media file is too large");
      }

      const bytes = new Uint8Array(await input.file.arrayBuffer());
      const storageKey = `${input.tenantId}/${createId()}-${sanitizeFilename(
        input.file.name
      )}`;
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

function sanitizeFilename(filename: string): string {
  return (
    filename
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "upload"
  );
}
