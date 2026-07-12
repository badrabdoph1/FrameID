import sharp from "sharp";

export const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_WEB_WIDTH = 1920;
export const MAX_WEB_HEIGHT = 1920;
export const WEBP_QUALITY = 82;
export const JPEG_QUALITY = 85;
export const PNG_COMPRESSION_LEVEL = 9;

export class ImageProcessingError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export type ProcessedImageResult = {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: "webp" | "jpeg" | "png";
};

export type ProcessImageOptions = {
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

function validateFileType(mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageProcessingError(
      "FID-IMG-001",
      `نوع الملف غير مدعوم. الصيغ المدعومة: JPEG, PNG, WebP.`,
      `Unsupported MIME type: ${mimeType}`
    );
  }
}

function validateFileSize(size: number, maxSizeBytes: number): void {
  if (size <= 0) {
    throw new ImageProcessingError(
      "FID-IMG-002",
      "الملف فارغ. اختر صورة صالحة.",
      "Empty file"
    );
  }
  if (size > maxSizeBytes) {
    throw new ImageProcessingError(
      "FID-IMG-003",
      `حجم الصورة يتجاوز الحد المسموح (${Math.round(maxSizeBytes / 1024 / 1024)}MB).`,
      `File size ${size} exceeds max ${maxSizeBytes}`
    );
  }
}

export function matchesImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((v, i) => bytes[i] === v);
  }
  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

function validateImageSignature(bytes: Uint8Array, mimeType: string): void {
  if (!matchesImageSignature(bytes, mimeType)) {
    throw new ImageProcessingError(
      "FID-IMG-004",
      "محتوى الملف لا يطابق صيغة الصورة. اختر صورة JPEG أو PNG أو WebP حقيقية.",
      `Invalid ${mimeType} signature`
    );
  }
}

export function validateImageFile(file: File, maxSizeBytes = MAX_UPLOAD_BYTES): void {
  validateFileType(file.type);
  validateFileSize(file.size, maxSizeBytes);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "") || "upload";
}

export function generateStorageKey(
  tenantId: string,
  originalFilename: string,
  createId: () => string
): string {
  const sanitized = sanitizeFilename(originalFilename);
  return `${tenantId}/${createId()}-${sanitized}`;
}

export async function processImageFromFile(
  file: File,
  options: ProcessImageOptions = {}
): Promise<ProcessedImageResult> {
  const maxSizeBytes = options.maxSizeBytes ?? MAX_UPLOAD_BYTES;
  const maxWidth = options.maxWidth ?? MAX_WEB_WIDTH;
  const maxHeight = options.maxHeight ?? MAX_WEB_HEIGHT;

  validateImageFile(file, maxSizeBytes);

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  validateImageSignature(new Uint8Array(inputBuffer), file.type);

  let sharpInstance = sharp(inputBuffer, { failOnError: false });

  sharpInstance = sharpInstance
    .rotate()
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4, lossless: false })
    .withMetadata({ exif: false, iptc: false, xmp: false });

  const processedBuffer = await sharpInstance.toBuffer();
  const metadata = await sharp(processedBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new ImageProcessingError(
      "FID-IMG-005",
      "تعذر قراءة أبعاد الصورة المعالجة.",
      "Missing dimensions after processing"
    );
  }

  return {
    buffer: processedBuffer,
    mimeType: "image/webp",
    sizeBytes: processedBuffer.length,
    width: metadata.width,
    height: metadata.height,
    format: "webp",
  };
}

export async function processImageFromBuffer(
  buffer: Buffer,
  mimeType: string,
  options: ProcessImageOptions = {}
): Promise<ProcessedImageResult> {
  const maxSizeBytes = options.maxSizeBytes ?? MAX_UPLOAD_BYTES;
  const maxWidth = options.maxWidth ?? MAX_WEB_WIDTH;
  const maxHeight = options.maxHeight ?? MAX_WEB_HEIGHT;

  validateFileType(mimeType);
  validateFileSize(buffer.length, maxSizeBytes);
  validateImageSignature(new Uint8Array(buffer), mimeType);

  let sharpInstance = sharp(buffer, { failOnError: false });

  sharpInstance = sharpInstance
    .rotate()
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4, lossless: false })
    .withMetadata({ exif: false, iptc: false, xmp: false });

  const processedBuffer = await sharpInstance.toBuffer();
  const metadata = await sharp(processedBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new ImageProcessingError(
      "FID-IMG-005",
      "تعذر قراءة أبعاد الصورة المعالجة.",
      "Missing dimensions after processing"
    );
  }

  return {
    buffer: processedBuffer,
    mimeType: "image/webp",
    sizeBytes: processedBuffer.length,
    width: metadata.width,
    height: metadata.height,
    format: "webp",
  };
}