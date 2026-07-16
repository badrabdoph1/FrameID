import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { commitPlatformAssetToGitHub } from "@/lib/content/git-sync";
import { processImageFromBuffer } from "@/modules/media/image-processing-service";

const MAX_PLATFORM_IMAGE_BYTES = 8 * 1024 * 1024;

type UploadOptions = {
  createId?: () => string;
  maxSizeBytes?: number;
  commit?: typeof commitPlatformAssetToGitHub;
};

export async function uploadPlatformTemplateImage(file: File, options: UploadOptions = {}) {
  return uploadPlatformImage(file, "templates", options);
}

export async function uploadPlatformSocialPreviewImage(file: File, options: UploadOptions = {}) {
  return uploadPlatformImage(file, "social-preview", options);
}

async function uploadPlatformImage(file: File, directory: string, options: UploadOptions) {
  const processed = await processImageFromBuffer(Buffer.from(await file.arrayBuffer()), file.type, {
    maxSizeBytes: options.maxSizeBytes ?? MAX_PLATFORM_IMAGE_BYTES,
  });
  const id = (options.createId ?? (() => crypto.randomUUID()))();
  const safeName = file.name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9\u0600-\u06ff]+/giu, "-").replace(/^-|-$/g, "") || "image";
  const path = `public/platform/${directory}/${id}-${safeName}.webp`;
  const result = await (options.commit ?? commitPlatformAssetToGitHub)({
    path,
    bytes: new Uint8Array(processed.buffer),
    message: `حفظ صورة منصة: ${directory}`,
  });
  if (!result.commitSha) throw new Error(result.error ?? "لم يتم حفظ صورة المنصة في GitHub");

  try {
    const localPath = join(process.cwd(), "public", "platform", directory, `${id}-${safeName}.webp`);
    await mkdir(join(process.cwd(), "public", "platform", directory), { recursive: true });
    await writeFile(localPath, Buffer.from(processed.buffer));
  } catch {
    // Silent fail in read-only environments (e.g. Vercel production)
  }

  return { url: path.replace(/^public/, ""), storageKey: path, commitId: result.commitSha };
}
