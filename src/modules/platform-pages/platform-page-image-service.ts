import sharp from "sharp";

import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  matchesImageSignature,
  sanitizeFilename,
} from "@/modules/media/image-processing-service";

type PlatformPageImageStorage = {
  save(input: {
    storageKey: string;
    bytes: Uint8Array;
    mimeType: string;
  }): Promise<{ url: string }>;
};

type PlatformPageImageRepository = {
  create(input: {
    id: string;
    storageKey: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
    focusX: number;
    focusY: number;
    zoom: number;
    originalName: string;
    actorId?: string | null;
  }): Promise<{ id: string; url: string }>;
};

type UploadPlatformPageImageInput = {
  bytes: Buffer;
  mimeType: string;
  originalName: string;
  focusX: number;
  focusY: number;
  zoom: number;
  actorId?: string | null;
};

export function createPlatformPageImageService({
  storage,
  repository,
  createId = () => crypto.randomUUID(),
}: {
  storage: PlatformPageImageStorage;
  repository: PlatformPageImageRepository;
  createId?: () => string;
}) {
  return {
    async upload(input: UploadPlatformPageImageInput) {
      validateInput(input);

      const rotated = await sharp(input.bytes).rotate().toBuffer();
      const metadata = await sharp(rotated).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("تعذر قراءة أبعاد الصورة");
      }

      const crop = calculateCrop({
        width: metadata.width,
        height: metadata.height,
        focusX: input.focusX,
        focusY: input.focusY,
        zoom: input.zoom,
      });
      const output = await sharp(rotated)
        .extract(crop)
        .resize(1920, 1080, { fit: "fill" })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const id = createId();
      const safeName = sanitizeFilename(input.originalName).replace(/\.[^.]+$/, "");
      const storageKey = `${id}-${safeName || "image"}.webp`;
      const stored = await storage.save({
        storageKey,
        bytes: new Uint8Array(output),
        mimeType: "image/webp",
      });

      return repository.create({
        id,
        storageKey,
        url: stored.url,
        mimeType: "image/webp",
        sizeBytes: output.length,
        width: 1920,
        height: 1080,
        focusX: input.focusX,
        focusY: input.focusY,
        zoom: input.zoom,
        originalName: input.originalName,
        actorId: input.actorId,
      });
    },
  };
}

function validateInput(input: UploadPlatformPageImageInput): void {
  if (
    !Number.isFinite(input.focusX) ||
    !Number.isFinite(input.focusY) ||
    input.focusX < 0 ||
    input.focusX > 1 ||
    input.focusY < 0 ||
    input.focusY > 1 ||
    !Number.isFinite(input.zoom) ||
    input.zoom < 1 ||
    input.zoom > 3
  ) {
    throw new Error("موضع القص غير صالح");
  }

  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new Error("صيغة الصورة غير مدعومة");
  }
  if (input.bytes.length === 0 || input.bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error("حجم الصورة غير صالح");
  }
  if (!matchesImageSignature(new Uint8Array(input.bytes), input.mimeType)) {
    throw new Error("محتوى الملف لا يطابق صيغة الصورة");
  }
}

function calculateCrop({
  width,
  height,
  focusX,
  focusY,
  zoom,
}: {
  width: number;
  height: number;
  focusX: number;
  focusY: number;
  zoom: number;
}) {
  const aspectRatio = 16 / 9;
  const baseWidth = Math.min(width, height * aspectRatio);
  const baseHeight = baseWidth / aspectRatio;
  const cropWidth = Math.max(1, Math.round(baseWidth / zoom));
  const cropHeight = Math.max(1, Math.round(baseHeight / zoom));
  const left = clamp(Math.round(focusX * width - cropWidth / 2), 0, width - cropWidth);
  const top = clamp(Math.round(focusY * height - cropHeight / 2), 0, height - cropHeight);

  return { left, top, width: cropWidth, height: cropHeight };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
