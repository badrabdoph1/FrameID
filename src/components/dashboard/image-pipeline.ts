export interface CompressedImage {
  blob: Blob;
  file: File;
  preview: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(
  file: File,
  maxWidth = 2000,
  quality = 0.82,
): Promise<CompressedImage> {
  const originalSize = file.size;

  const img = await createImageBitmap(file);

  const originalWidth = img.width;
  let { width, height } = img;
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  img.close();

  const targetType = supportsWebP() ? "image/webp" : file.type;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob returned null"))),
      targetType,
      quality,
    );
  });

  canvas.width = 0;
  canvas.height = 0;

  const resized = originalWidth > maxWidth;
  const meaningfulSavings = blob.size < originalSize * 0.95;
  if (!resized && file.type === "image/webp" && !meaningfulSavings) {
    return {
      blob: file,
      file,
      preview: URL.createObjectURL(file),
      width,
      height,
      originalSize,
      compressedSize: originalSize,
    };
  }

  const extension = targetType === "image/webp" ? "webp" : file.name.split(".").pop() || "jpg";
  const outputName = file.name.replace(/\.[^.]+$/u, "") + `.${extension}`;
  const outputFile = new File([blob], outputName, { type: targetType });

  return {
    blob,
    file: outputFile,
    preview: URL.createObjectURL(blob),
    width,
    height,
    originalSize,
    compressedSize: blob.size,
  };
}

function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;
  const elem = document.createElement("canvas");
  return elem.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}

export function revokePreview(url: string): void {
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
]);

export function isImageType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType);
}
